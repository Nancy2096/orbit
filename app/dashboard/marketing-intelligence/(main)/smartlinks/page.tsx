"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { 
  Link2, 
  Plus, 
  Copy, 
  ExternalLink, 
  BarChart3, 
  MousePointer, 
  Eye, 
  Globe, 
  QrCode, 
  Download, 
  Trash2, 
  Edit, 
  TrendingUp,
  Calendar,
  Filter,
  Search,
  Smartphone,
  Monitor,
  Tablet,
  MapPin
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts"

// Mock Smartlinks Data
const mockSmartlinks = [
  {
    id: 1,
    shortUrl: "mkt.link/promo2024",
    originalUrl: "https://ejemplo.com/landing-page-promocion-especial-2024?utm_source=social&utm_medium=instagram&utm_campaign=promo_enero",
    title: "Promoción Enero 2024",
    clicks: 4523,
    uniqueClicks: 3891,
    createdAt: "2024-01-05",
    lastClick: "Hace 2 min",
    status: "active",
    tags: ["promoción", "instagram", "q1"],
    client: "TechCorp",
    campaign: "Q1 2024",
    qrEnabled: true,
  },
  {
    id: 2,
    shortUrl: "mkt.link/webinar-ia",
    originalUrl: "https://ejemplo.com/registro-webinar-inteligencia-artificial-marketing",
    title: "Webinar IA Marketing",
    clicks: 2891,
    uniqueClicks: 2456,
    createdAt: "2024-01-10",
    lastClick: "Hace 15 min",
    status: "active",
    tags: ["webinar", "leads", "ia"],
    client: "TechCorp",
    campaign: "Webinars",
    qrEnabled: true,
  },
  {
    id: 3,
    shortUrl: "mkt.link/descarga-ebook",
    originalUrl: "https://ejemplo.com/recursos/ebook-tendencias-marketing-2024",
    title: "Ebook Tendencias 2024",
    clicks: 1567,
    uniqueClicks: 1234,
    createdAt: "2024-01-08",
    lastClick: "Hace 1 hora",
    status: "active",
    tags: ["ebook", "leads", "content"],
    client: "FashionBrand",
    campaign: "Content Marketing",
    qrEnabled: false,
  },
  {
    id: 4,
    shortUrl: "mkt.link/demo-gratis",
    originalUrl: "https://ejemplo.com/solicitar-demo-gratuita-plataforma",
    title: "Demo Gratuita",
    clicks: 892,
    uniqueClicks: 756,
    createdAt: "2024-01-12",
    lastClick: "Hace 3 horas",
    status: "active",
    tags: ["demo", "sales", "conversión"],
    client: "TechCorp",
    campaign: "Demos",
    qrEnabled: true,
  },
  {
    id: 5,
    shortUrl: "mkt.link/black-friday",
    originalUrl: "https://ejemplo.com/ofertas-black-friday-2023",
    title: "Black Friday 2023",
    clicks: 15234,
    uniqueClicks: 12456,
    createdAt: "2023-11-20",
    lastClick: "Hace 2 días",
    status: "expired",
    tags: ["black-friday", "ventas", "promoción"],
    client: "FashionBrand",
    campaign: "Black Friday 2023",
    qrEnabled: true,
  },
]

const clicksOverTime = [
  { date: "01 Ene", clicks: 450 },
  { date: "02 Ene", clicks: 380 },
  { date: "03 Ene", clicks: 520 },
  { date: "04 Ene", clicks: 610 },
  { date: "05 Ene", clicks: 890 },
  { date: "06 Ene", clicks: 720 },
  { date: "07 Ene", clicks: 680 },
  { date: "08 Ene", clicks: 540 },
  { date: "09 Ene", clicks: 750 },
  { date: "10 Ene", clicks: 820 },
  { date: "11 Ene", clicks: 910 },
  { date: "12 Ene", clicks: 780 },
  { date: "13 Ene", clicks: 650 },
  { date: "14 Ene", clicks: 590 },
]

const deviceData = [
  { name: "Móvil", value: 65, color: "#3b82f6" },
  { name: "Desktop", value: 28, color: "#22c55e" },
  { name: "Tablet", value: 7, color: "#f59e0b" },
]

const topCountries = [
  { country: "México", clicks: 8542, percentage: 45 },
  { country: "España", clicks: 3256, percentage: 17 },
  { country: "Colombia", clicks: 2891, percentage: 15 },
  { country: "Argentina", clicks: 2234, percentage: 12 },
  { country: "Chile", clicks: 1567, percentage: 8 },
  { country: "Otros", clicks: 617, percentage: 3 },
]

const topReferrers = [
  { source: "Instagram", clicks: 7823, percentage: 41 },
  { source: "Facebook", clicks: 4521, percentage: 24 },
  { source: "Twitter/X", clicks: 2345, percentage: 12 },
  { source: "LinkedIn", clicks: 1890, percentage: 10 },
  { source: "Email", clicks: 1456, percentage: 8 },
  { source: "Directo", clicks: 1072, percentage: 5 },
]

export default function SmartlinksPage() {
  const [selectedClient, setSelectedClient] = useState("all")
  const [activeTab, setActiveTab] = useState("links")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [newLink, setNewLink] = useState({ url: "", customSlug: "", title: "" })

  const filteredLinks = mockSmartlinks.filter(link => 
    link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.shortUrl.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalClicks = mockSmartlinks.reduce((acc, link) => acc + link.clicks, 0)
  const totalUniqueClicks = mockSmartlinks.reduce((acc, link) => acc + link.uniqueClicks, 0)
  const activeLinks = mockSmartlinks.filter(l => l.status === "active").length

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Toast notification would go here
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Smartlinks</h1>
            <p className="text-muted-foreground">
              Crea, gestiona y analiza enlaces cortos con seguimiento
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
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Smartlink
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Smartlink</DialogTitle>
                  <DialogDescription>
                    Crea un enlace corto con seguimiento de clics
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>URL Original</Label>
                    <Input 
                      placeholder="https://ejemplo.com/mi-pagina-larga"
                      value={newLink.url}
                      onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug Personalizado (opcional)</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">mkt.link/</span>
                      <Input 
                        placeholder="mi-enlace"
                        value={newLink.customSlug}
                        onChange={(e) => setNewLink({...newLink, customSlug: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Título de Referencia</Label>
                    <Input 
                      placeholder="Campaña Enero 2024"
                      value={newLink.title}
                      onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="techcorp">TechCorp</SelectItem>
                        <SelectItem value="fashionbrand">FashionBrand</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Generar código QR</Label>
                      <p className="text-xs text-muted-foreground">Crear QR automáticamente</p>
                    </div>
                    <Switch />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => setShowCreateDialog(false)}>
                    Crear Smartlink
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clics</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +18.2% vs mes anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clics Únicos</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUniqueClicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((totalUniqueClicks / totalClicks) * 100).toFixed(1)}% del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Links Activos</CardTitle>
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeLinks}</div>
              <p className="text-xs text-muted-foreground">
                De {mockSmartlinks.length} totales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CTR Promedio</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12.4%</div>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +2.1% vs promedio
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="links">Mis Links</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="qr">Códigos QR</TabsTrigger>
          </TabsList>

          {/* Links Tab */}
          <TabsContent value="links" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Todos los Smartlinks</CardTitle>
                    <CardDescription>Gestiona tus enlaces cortos</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Buscar links..." 
                        className="pl-9 w-[250px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtrar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredLinks.map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Link2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{link.title}</p>
                            <Badge variant={link.status === "active" ? "default" : "secondary"}>
                              {link.status === "active" ? "Activo" : "Expirado"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-sm text-primary bg-primary/10 px-2 py-0.5 rounded">
                              {link.shortUrl}
                            </code>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(link.shortUrl)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                            {link.originalUrl}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {link.tags.map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-2xl font-bold">{link.clicks.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">clics totales</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{link.uniqueClicks.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">únicos</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{link.lastClick}</p>
                          <p className="text-xs text-muted-foreground">último clic</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon">
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          {link.qrEnabled && (
                            <Button variant="ghost" size="icon">
                              <QrCode className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            {/* Clicks Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Clics en el Tiempo</CardTitle>
                <CardDescription>Últimos 14 días</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={clicksOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Device Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Por Dispositivo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deviceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {deviceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    {deviceData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs">{item.name} ({item.value}%)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Countries */}
              <Card>
                <CardHeader>
                  <CardTitle>Por País</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topCountries.slice(0, 5).map((country) => (
                      <div key={country.country} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{country.country}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{country.clicks.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground">({country.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Referrers */}
              <Card>
                <CardHeader>
                  <CardTitle>Por Fuente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topReferrers.slice(0, 5).map((ref) => (
                      <div key={ref.source} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{ref.source}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{ref.clicks.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground">({ref.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* QR Codes Tab */}
          <TabsContent value="qr" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Códigos QR</CardTitle>
                <CardDescription>Gestiona los códigos QR de tus smartlinks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {mockSmartlinks.filter(l => l.qrEnabled).map((link) => (
                    <Card key={link.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col items-center">
                          <div className="h-32 w-32 bg-muted rounded-lg flex items-center justify-center mb-4">
                            <QrCode className="h-20 w-20 text-muted-foreground" />
                          </div>
                          <p className="font-medium text-center">{link.title}</p>
                          <code className="text-xs text-muted-foreground mt-1">{link.shortUrl}</code>
                          <div className="flex items-center gap-2 mt-4">
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              PNG
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              SVG
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  )
}
