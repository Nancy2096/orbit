"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
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
import {
  ChevronRight,
  Search,
  Globe,
  Plug,
  FileText,
  Target,
  Settings2,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Link2,
  Bot,
  MapPin,
} from "lucide-react"
import { toast } from "sonner"
import { getBrandById } from "@/lib/marketing-intelligence/brand-mock-data"

type SearchEngine = "google" | "bing" | "both"
type KeywordPriority = "alta" | "media" | "baja"

interface TargetKeyword {
  id: string
  keyword: string
  priority: KeywordPriority
  targetUrl: string
  volume: number
}

interface MetaPage {
  id: string
  path: string
  title: string
  description: string
}

interface AuditCheck {
  id: string
  label: string
  description: string
  enabled: boolean
}

const defaultKeywords: TargetKeyword[] = [
  { id: "kw-1", keyword: "departamentos en venta", priority: "alta", targetUrl: "/", volume: 8100 },
  { id: "kw-2", keyword: "preventa inmobiliaria", priority: "media", targetUrl: "/preventa", volume: 2400 },
]

const defaultPages: MetaPage[] = [
  {
    id: "pg-1",
    path: "/",
    title: "Inicio | Proyecto Inmobiliario",
    description: "Descubre departamentos en preventa con amenidades de primer nivel.",
  },
]

const defaultAuditChecks: AuditCheck[] = [
  { id: "ac-1", label: "Meta titles y descriptions", description: "Verificar títulos y descripciones en todas las páginas", enabled: true },
  { id: "ac-2", label: "Texto alternativo en imágenes", description: "Detectar imágenes sin atributo alt", enabled: true },
  { id: "ac-3", label: "Enlaces rotos", description: "Rastrear enlaces internos y externos rotos", enabled: true },
  { id: "ac-4", label: "Velocidad de carga (Core Web Vitals)", description: "Monitorear LCP, CLS e INP", enabled: true },
  { id: "ac-5", label: "Datos estructurados (Schema)", description: "Validar marcado schema.org", enabled: false },
  { id: "ac-6", label: "Compatibilidad móvil", description: "Verificar diseño responsivo", enabled: true },
]

const priorityConfig: Record<KeywordPriority, { label: string; color: string }> = {
  alta: { label: "Alta", color: "bg-red-100 text-red-700" },
  media: { label: "Media", color: "bg-amber-100 text-amber-700" },
  baja: { label: "Baja", color: "bg-slate-100 text-slate-700" },
}

export default function BrandSeoPage() {
  const params = useParams()
  const brandId = params.id as string
  const brand = getBrandById(brandId)

  // General config
  const [seoEnabled, setSeoEnabled] = useState(true)
  const [domain, setDomain] = useState(brand?.website?.replace(/^https?:\/\//, "") ?? "")
  const [searchEngine, setSearchEngine] = useState<SearchEngine>("google")
  const [targetCountry, setTargetCountry] = useState(brand?.country ?? "México")
  const [searchConsoleConnected, setSearchConsoleConnected] = useState(false)
  const [analyticsConnected, setAnalyticsConnected] = useState(false)
  const [sitemapUrl, setSitemapUrl] = useState("/sitemap.xml")
  const [robotsEnabled, setRobotsEnabled] = useState(true)
  const [autoAuditEnabled, setAutoAuditEnabled] = useState(true)
  const [auditFrequency, setAuditFrequency] = useState("weekly")

  // Keywords
  const [keywords, setKeywords] = useState<TargetKeyword[]>(defaultKeywords)
  const [newKeyword, setNewKeyword] = useState("")
  const [newKeywordPriority, setNewKeywordPriority] = useState<KeywordPriority>("media")
  const [newKeywordUrl, setNewKeywordUrl] = useState("")

  // Meta pages
  const [pages, setPages] = useState<MetaPage[]>(defaultPages)

  // Audit checks
  const [auditChecks, setAuditChecks] = useState<AuditCheck[]>(defaultAuditChecks)

  if (!brand) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Marca no encontrada</p>
        <Button variant="link" asChild>
          <Link href="/orbit-marketing-intelligence/brands">Volver a marcas</Link>
        </Button>
      </div>
    )
  }

  const handleSaveGeneral = () => {
    toast.success("Configuración SEO guardada", {
      description: "Los ajustes generales de SEO se actualizaron correctamente.",
    })
  }

  const handleConnect = (service: "console" | "analytics") => {
    if (service === "console") {
      setSearchConsoleConnected((prev) => !prev)
      toast.success(searchConsoleConnected ? "Search Console desconectado" : "Search Console conectado")
    } else {
      setAnalyticsConnected((prev) => !prev)
      toast.success(analyticsConnected ? "Analytics desconectado" : "Analytics conectado")
    }
  }

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) {
      toast.error("Escribe una palabra clave")
      return
    }
    setKeywords((prev) => [
      ...prev,
      {
        id: `kw-${Date.now()}`,
        keyword: newKeyword.trim(),
        priority: newKeywordPriority,
        targetUrl: newKeywordUrl.trim() || "/",
        volume: 0,
      },
    ])
    setNewKeyword("")
    setNewKeywordUrl("")
    setNewKeywordPriority("media")
    toast.success("Keyword agregada")
  }

  const handleRemoveKeyword = (id: string) => {
    setKeywords((prev) => prev.filter((k) => k.id !== id))
    toast.success("Keyword eliminada")
  }

  const handleAddPage = () => {
    setPages((prev) => [
      ...prev,
      { id: `pg-${Date.now()}`, path: "/nueva-pagina", title: "", description: "" },
    ])
  }

  const handleUpdatePage = (id: string, field: keyof MetaPage, value: string) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const handleRemovePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id))
    toast.success("Página eliminada")
  }

  const handleSavePages = () => {
    toast.success("Meta tags guardados", {
      description: `Se guardaron ${pages.length} página(s).`,
    })
  }

  const toggleAuditCheck = (id: string) => {
    setAuditChecks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)),
    )
  }

  const handleSaveAudit = () => {
    const active = auditChecks.filter((c) => c.enabled).length
    toast.success("Auditoría configurada", {
      description: `${active} verificación(es) activa(s) · Frecuencia: ${auditFrequency === "daily" ? "diaria" : auditFrequency === "weekly" ? "semanal" : "mensual"}.`,
    })
  }

  const activeChecks = auditChecks.filter((c) => c.enabled).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/orbit-marketing-intelligence/brands" className="hover:text-foreground">
              Marcas
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link
              href={`/orbit-marketing-intelligence/brands/${brandId}`}
              className="hover:text-foreground"
            >
              {brand.name}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>SEO</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Search className="h-6 w-6 text-primary" />
              Configuración SEO
            </h1>
            <Badge variant="outline" className={seoEnabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}>
              {seoEnabled ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Configura el SEO de {brand.name}: dominio, conexiones, keywords, meta tags y auditoría.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="seo-enabled" className="text-sm text-muted-foreground">
              SEO habilitado
            </Label>
            <Switch id="seo-enabled" checked={seoEnabled} onCheckedChange={setSeoEnabled} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Settings2 className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="keywords">
            <Target className="h-4 w-4 mr-2" />
            Keywords
          </TabsTrigger>
          <TabsTrigger value="meta">
            <FileText className="h-4 w-4 mr-2" />
            Meta Tags
          </TabsTrigger>
          <TabsTrigger value="audit">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Auditoría
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Dominio y región
              </CardTitle>
              <CardDescription>Define el sitio web y el mercado objetivo del proyecto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="domain">Dominio principal</Label>
                  <Input
                    id="domain"
                    placeholder="ejemplo.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="search-engine">Motor de búsqueda</Label>
                  <Select value={searchEngine} onValueChange={(v) => setSearchEngine(v as SearchEngine)}>
                    <SelectTrigger id="search-engine">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="bing">Bing</SelectItem>
                      <SelectItem value="both">Google y Bing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    País objetivo
                  </Label>
                  <Input
                    id="country"
                    value={targetCountry}
                    onChange={(e) => setTargetCountry(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sitemap">URL del Sitemap</Label>
                  <Input
                    id="sitemap"
                    value={sitemapUrl}
                    onChange={(e) => setSitemapUrl(e.target.value)}
                  />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Archivo robots.txt</p>
                  <p className="text-xs text-muted-foreground">Permitir indexación por buscadores</p>
                </div>
                <Switch checked={robotsEnabled} onCheckedChange={setRobotsEnabled} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plug className="h-4 w-4 text-primary" />
                Conexiones
              </CardTitle>
              <CardDescription>Vincula herramientas de Google para obtener datos reales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Search className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Google Search Console</p>
                    <p className="text-xs text-muted-foreground">Posiciones, impresiones y clics orgánicos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {searchConsoleConnected && (
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Conectado
                    </Badge>
                  )}
                  <Button
                    variant={searchConsoleConnected ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleConnect("console")}
                  >
                    {searchConsoleConnected ? "Desconectar" : "Conectar"}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-50">
                    <Globe className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Google Analytics 4</p>
                    <p className="text-xs text-muted-foreground">Tráfico orgánico y comportamiento</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {analyticsConnected && (
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Conectado
                    </Badge>
                  )}
                  <Button
                    variant={analyticsConnected ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleConnect("analytics")}
                  >
                    {analyticsConnected ? "Desconectar" : "Conectar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveGeneral}>
              <Save className="h-4 w-4 mr-2" />
              Guardar configuración
            </Button>
          </div>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Keywords objetivo
              </CardTitle>
              <CardDescription>
                Define las palabras clave que quieres posicionar para este proyecto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="new-keyword">Palabra clave</Label>
                  <Input
                    id="new-keyword"
                    placeholder="ej. departamentos en preventa"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-priority">Prioridad</Label>
                  <Select
                    value={newKeywordPriority}
                    onValueChange={(v) => setNewKeywordPriority(v as KeywordPriority)}
                  >
                    <SelectTrigger id="new-priority" className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="baja">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-url">URL destino</Label>
                  <Input
                    id="new-url"
                    placeholder="/"
                    className="w-40"
                    value={newKeywordUrl}
                    onChange={(e) => setNewKeywordUrl(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddKeyword}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead>URL destino</TableHead>
                      <TableHead className="text-right">Volumen/mes</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keywords.map((kw) => (
                      <TableRow key={kw.id}>
                        <TableCell className="font-medium">{kw.keyword}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={priorityConfig[kw.priority].color}>
                            {priorityConfig[kw.priority].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{kw.targetUrl}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {kw.volume > 0 ? kw.volume.toLocaleString() : "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleRemoveKeyword(kw.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {keywords.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No hay keywords configuradas. Agrega la primera arriba.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meta Tags Tab */}
        <TabsContent value="meta" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Meta tags por página
                  </CardTitle>
                  <CardDescription>
                    Configura el título y la descripción que aparecen en los buscadores
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddPage}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar página
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {pages.map((page) => (
                <div key={page.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      <Input
                        value={page.path}
                        onChange={(e) => handleUpdatePage(page.id, "path", e.target.value)}
                        className="max-w-xs font-mono text-sm"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleRemovePage(page.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">
                      Título (
                      <span className={page.title.length > 60 ? "text-red-600" : "text-muted-foreground"}>
                        {page.title.length}/60
                      </span>
                      )
                    </Label>
                    <Input
                      placeholder="Título de la página"
                      value={page.title}
                      onChange={(e) => handleUpdatePage(page.id, "title", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">
                      Meta description (
                      <span className={page.description.length > 160 ? "text-red-600" : "text-muted-foreground"}>
                        {page.description.length}/160
                      </span>
                      )
                    </Label>
                    <Textarea
                      placeholder="Descripción que aparece en los resultados de búsqueda"
                      value={page.description}
                      onChange={(e) => handleUpdatePage(page.id, "description", e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              ))}
              {pages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay páginas configuradas. Agrega la primera con el botón de arriba.
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={handleSavePages}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar meta tags
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                Auditoría automática
              </CardTitle>
              <CardDescription>
                Programa revisiones técnicas periódicas del sitio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Ejecutar auditoría automática</p>
                  <p className="text-xs text-muted-foreground">
                    Revisa el sitio según la frecuencia seleccionada
                  </p>
                </div>
                <Switch checked={autoAuditEnabled} onCheckedChange={setAutoAuditEnabled} />
              </div>
              {autoAuditEnabled && (
                <div className="space-y-2 max-w-xs">
                  <Label htmlFor="audit-freq">Frecuencia</Label>
                  <Select value={auditFrequency} onValueChange={setAuditFrequency}>
                    <SelectTrigger id="audit-freq">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diaria</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Verificaciones
                  </CardTitle>
                  <CardDescription>
                    Selecciona qué aspectos técnicos se revisarán
                  </CardDescription>
                </div>
                <Badge variant="secondary">{activeChecks} activas</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {auditChecks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {check.enabled ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{check.label}</p>
                      <p className="text-xs text-muted-foreground">{check.description}</p>
                    </div>
                  </div>
                  <Switch checked={check.enabled} onCheckedChange={() => toggleAuditCheck(check.id)} />
                </div>
              ))}
              {activeChecks === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 text-amber-700 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  No hay verificaciones activas. La auditoría no revisará nada.
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={handleSaveAudit}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar auditoría
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
