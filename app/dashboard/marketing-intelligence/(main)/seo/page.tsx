"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Globe,
  FileText,
  Link2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Download,
  Filter,
  ArrowUp,
  ArrowDown,
  Target,
  Eye,
  MousePointer,
  BarChart3
} from "lucide-react"

// Mock SEO Data
const mockKeywords = [
  { id: 1, keyword: "agencia marketing digital", position: 3, previousPosition: 5, volume: 12500, difficulty: 72, url: "/servicios/marketing-digital", trend: "up" },
  { id: 2, keyword: "marketing digital mexico", position: 7, previousPosition: 4, volume: 8900, difficulty: 65, url: "/", trend: "down" },
  { id: 3, keyword: "redes sociales empresas", position: 12, previousPosition: 12, volume: 6200, difficulty: 58, url: "/servicios/redes-sociales", trend: "stable" },
  { id: 4, keyword: "publicidad en facebook", position: 5, previousPosition: 8, volume: 15000, difficulty: 78, url: "/servicios/paid-media", trend: "up" },
  { id: 5, keyword: "seo servicios", position: 18, previousPosition: 22, volume: 4500, difficulty: 55, url: "/servicios/seo", trend: "up" },
  { id: 6, keyword: "community manager precio", position: 9, previousPosition: 11, volume: 3200, difficulty: 45, url: "/precios", trend: "up" },
  { id: 7, keyword: "estrategia contenidos", position: 15, previousPosition: 14, volume: 2800, difficulty: 52, url: "/blog/estrategia-contenidos", trend: "down" },
  { id: 8, keyword: "google ads agencia", position: 4, previousPosition: 6, volume: 5600, difficulty: 68, url: "/servicios/google-ads", trend: "up" },
]

const mockPages = [
  { url: "/", title: "Inicio | Agencia de Marketing Digital", score: 85, issues: 2, indexed: true, impressions: 45000, clicks: 2800, ctr: 6.2 },
  { url: "/servicios", title: "Nuestros Servicios de Marketing", score: 78, issues: 4, indexed: true, impressions: 12000, clicks: 890, ctr: 7.4 },
  { url: "/servicios/seo", title: "Servicios de SEO Profesional", score: 92, issues: 1, indexed: true, impressions: 8500, clicks: 620, ctr: 7.3 },
  { url: "/blog", title: "Blog de Marketing Digital", score: 88, issues: 2, indexed: true, impressions: 25000, clicks: 1500, ctr: 6.0 },
  { url: "/contacto", title: "Contacto", score: 65, issues: 6, indexed: true, impressions: 3200, clicks: 180, ctr: 5.6 },
  { url: "/casos-exito", title: "Casos de Éxito", score: 72, issues: 3, indexed: false, impressions: 0, clicks: 0, ctr: 0 },
]

const mockBacklinks = [
  { domain: "entrepreneur.com", url: "https://entrepreneur.com/articulo/marketing", da: 92, pa: 78, anchor: "agencia de marketing", status: "active", date: "2024-01-15" },
  { domain: "forbes.com.mx", url: "https://forbes.com.mx/negocios/marketing", da: 88, pa: 72, anchor: "estrategias digitales", status: "active", date: "2024-01-10" },
  { domain: "merca20.com", url: "https://merca20.com/tendencias-2024", da: 75, pa: 65, anchor: "ver más", status: "active", date: "2024-01-08" },
  { domain: "puromarketing.com", url: "https://puromarketing.com/44/articulo", da: 72, pa: 60, anchor: "expertos en seo", status: "lost", date: "2023-12-20" },
  { domain: "marketingdirecto.com", url: "https://marketingdirecto.com/digital", da: 70, pa: 58, anchor: "marketing digital", status: "active", date: "2023-12-15" },
]

const mockIssues = [
  { id: 1, type: "critical", title: "Páginas sin meta description", count: 5, impact: "Alto" },
  { id: 2, type: "critical", title: "Imágenes sin alt text", count: 23, impact: "Alto" },
  { id: 3, type: "warning", title: "Títulos duplicados", count: 3, impact: "Medio" },
  { id: 4, type: "warning", title: "URLs muy largas", count: 8, impact: "Bajo" },
  { id: 5, type: "warning", title: "Enlaces rotos internos", count: 2, impact: "Medio" },
  { id: 6, type: "info", title: "Páginas con bajo contenido", count: 4, impact: "Bajo" },
]

export default function SEOPage() {
  const [selectedClient, setSelectedClient] = useState("all")
  const [activeTab, setActiveTab] = useState("overview")
  const [searchKeyword, setSearchKeyword] = useState("")

  const filteredKeywords = mockKeywords.filter(k => 
    k.keyword.toLowerCase().includes(searchKeyword.toLowerCase())
  )

  const getPositionChange = (current: number, previous: number) => {
    const change = previous - current
    if (change > 0) return { icon: ArrowUp, color: "text-green-600", text: `+${change}` }
    if (change < 0) return { icon: ArrowDown, color: "text-red-600", text: `${change}` }
    return { icon: Minus, color: "text-muted-foreground", text: "0" }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-amber-600"
    return "text-red-600"
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100"
    if (score >= 60) return "bg-amber-100"
    return "bg-red-100"
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SEO</h1>
            <p className="text-muted-foreground">
              Monitorea posiciones, audita páginas y gestiona backlinks
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
                <SelectItem value="fooddelivery">FoodDelivery</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Keywords en Top 10</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +3 vs mes anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impresiones</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">125.4K</div>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +12.5% vs mes anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clics Orgánicos</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8,234</div>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +8.3% vs mes anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Domain Authority</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">52</div>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +2 vs mes anterior
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="pages">Páginas</TabsTrigger>
            <TabsTrigger value="backlinks">Backlinks</TabsTrigger>
            <TabsTrigger value="audit">Auditoría</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Top Keywords */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Keywords</CardTitle>
                  <CardDescription>Mejores posiciones en buscadores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockKeywords.slice(0, 5).map((kw) => {
                      const change = getPositionChange(kw.position, kw.previousPosition)
                      return (
                        <div key={kw.id} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{kw.keyword}</p>
                            <p className="text-xs text-muted-foreground">{kw.volume.toLocaleString()} búsquedas/mes</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="font-bold">#{kw.position}</span>
                            </div>
                            <div className={`flex items-center gap-1 ${change.color}`}>
                              <change.icon className="h-3 w-3" />
                              <span className="text-xs">{change.text}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Issues Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Problemas Detectados</CardTitle>
                  <CardDescription>Auditoría técnica del sitio</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockIssues.map((issue) => (
                      <div key={issue.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          {issue.type === "critical" && <XCircle className="h-4 w-4 text-red-500" />}
                          {issue.type === "warning" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                          {issue.type === "info" && <CheckCircle className="h-4 w-4 text-blue-500" />}
                          <span className="text-sm">{issue.title}</span>
                        </div>
                        <Badge variant={issue.type === "critical" ? "destructive" : "secondary"}>
                          {issue.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Backlinks */}
            <Card>
              <CardHeader>
                <CardTitle>Backlinks Recientes</CardTitle>
                <CardDescription>Últimos enlaces entrantes detectados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockBacklinks.slice(0, 4).map((link, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <Globe className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{link.domain}</p>
                          <p className="text-xs text-muted-foreground">Anchor: {link.anchor}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">DA: {link.da}</p>
                          <p className="text-xs text-muted-foreground">PA: {link.pa}</p>
                        </div>
                        <Badge variant={link.status === "active" ? "default" : "secondary"}>
                          {link.status === "active" ? "Activo" : "Perdido"}
                        </Badge>
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Keywords Tab */}
          <TabsContent value="keywords" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Seguimiento de Keywords</CardTitle>
                    <CardDescription>Monitorea las posiciones de tus palabras clave</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Buscar keyword..." 
                        className="pl-9 w-[250px]"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                      />
                    </div>
                    <Button>
                      + Agregar Keyword
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left text-sm font-medium">Keyword</th>
                        <th className="p-3 text-left text-sm font-medium">Posición</th>
                        <th className="p-3 text-left text-sm font-medium">Cambio</th>
                        <th className="p-3 text-left text-sm font-medium">Volumen</th>
                        <th className="p-3 text-left text-sm font-medium">Dificultad</th>
                        <th className="p-3 text-left text-sm font-medium">URL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKeywords.map((kw) => {
                        const change = getPositionChange(kw.position, kw.previousPosition)
                        return (
                          <tr key={kw.id} className="border-b">
                            <td className="p-3">
                              <span className="font-medium">{kw.keyword}</span>
                            </td>
                            <td className="p-3">
                              <span className="font-bold">#{kw.position}</span>
                            </td>
                            <td className="p-3">
                              <span className={`flex items-center gap-1 ${change.color}`}>
                                <change.icon className="h-3 w-3" />
                                {change.text}
                              </span>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {kw.volume.toLocaleString()}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Progress value={kw.difficulty} className="w-16 h-2" />
                                <span className="text-sm text-muted-foreground">{kw.difficulty}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <a href="#" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                {kw.url}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pages Tab */}
          <TabsContent value="pages" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Análisis de Páginas</CardTitle>
                    <CardDescription>Rendimiento SEO por página</CardDescription>
                  </div>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left text-sm font-medium">Página</th>
                        <th className="p-3 text-left text-sm font-medium">Score SEO</th>
                        <th className="p-3 text-left text-sm font-medium">Problemas</th>
                        <th className="p-3 text-left text-sm font-medium">Impresiones</th>
                        <th className="p-3 text-left text-sm font-medium">Clics</th>
                        <th className="p-3 text-left text-sm font-medium">CTR</th>
                        <th className="p-3 text-left text-sm font-medium">Indexada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockPages.map((page, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-3">
                            <div>
                              <p className="font-medium text-sm">{page.title}</p>
                              <p className="text-xs text-muted-foreground">{page.url}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${getScoreBg(page.score)}`}>
                              <span className={`font-bold ${getScoreColor(page.score)}`}>{page.score}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant={page.issues > 3 ? "destructive" : page.issues > 0 ? "secondary" : "default"}>
                              {page.issues} problemas
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {page.impressions.toLocaleString()}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {page.clicks.toLocaleString()}
                          </td>
                          <td className="p-3">
                            <span className={page.ctr > 5 ? "text-green-600" : "text-muted-foreground"}>
                              {page.ctr}%
                            </span>
                          </td>
                          <td className="p-3">
                            {page.indexed ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backlinks Tab */}
          <TabsContent value="backlinks" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Backlinks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,247</div>
                  <p className="text-xs text-green-600">+45 este mes</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Dominios Referentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">312</div>
                  <p className="text-xs text-green-600">+12 este mes</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Backlinks Perdidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">8</div>
                  <p className="text-xs text-muted-foreground">Este mes</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Todos los Backlinks</CardTitle>
                    <CardDescription>Lista completa de enlaces entrantes</CardDescription>
                  </div>
                  <Button>
                    + Agregar Backlink
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left text-sm font-medium">Dominio</th>
                        <th className="p-3 text-left text-sm font-medium">DA</th>
                        <th className="p-3 text-left text-sm font-medium">PA</th>
                        <th className="p-3 text-left text-sm font-medium">Anchor Text</th>
                        <th className="p-3 text-left text-sm font-medium">Estado</th>
                        <th className="p-3 text-left text-sm font-medium">Fecha</th>
                        <th className="p-3 text-left text-sm font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockBacklinks.map((link, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{link.domain}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={link.da >= 70 ? "text-green-600 font-medium" : ""}>{link.da}</span>
                          </td>
                          <td className="p-3 text-muted-foreground">{link.pa}</td>
                          <td className="p-3 text-muted-foreground">{link.anchor}</td>
                          <td className="p-3">
                            <Badge variant={link.status === "active" ? "default" : "destructive"}>
                              {link.status === "active" ? "Activo" : "Perdido"}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">{link.date}</td>
                          <td className="p-3">
                            <Button variant="ghost" size="icon">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Tab */}
          <TabsContent value="audit" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Score General</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="text-3xl font-bold text-green-600">78</div>
                    <span className="text-muted-foreground">/100</span>
                  </div>
                  <Progress value={78} className="mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-600">Críticos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">28</div>
                  <p className="text-xs text-muted-foreground">Problemas a resolver</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-600">Advertencias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">13</div>
                  <p className="text-xs text-muted-foreground">Mejoras sugeridas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-600">Pasados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">156</div>
                  <p className="text-xs text-muted-foreground">Checks correctos</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Problemas Detectados</CardTitle>
                    <CardDescription>Lista de problemas técnicos SEO</CardDescription>
                  </div>
                  <Button>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Nueva Auditoría
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockIssues.map((issue) => (
                    <div key={issue.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4">
                        {issue.type === "critical" && (
                          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                            <XCircle className="h-5 w-5 text-red-600" />
                          </div>
                        )}
                        {issue.type === "warning" && (
                          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                          </div>
                        )}
                        {issue.type === "info" && (
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{issue.title}</p>
                          <p className="text-sm text-muted-foreground">Impacto: {issue.impact}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={issue.type === "critical" ? "destructive" : "secondary"}>
                          {issue.count} instancias
                        </Badge>
                        <Button variant="outline" size="sm">
                          Ver detalles
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
