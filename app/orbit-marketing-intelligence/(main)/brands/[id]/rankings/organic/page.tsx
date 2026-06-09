"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Trophy,
  TrendingUp,
  TrendingDown,
  Search,
  Download,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Play,
  Medal,
  Image as ImageIcon,
  Film,
  LayoutGrid,
} from "lucide-react"
import { Instagram, Facebook, Smartphone, Youtube, Linkedin } from "lucide-react"
import { KPISemaphore } from "@/components/marketing-intelligence/brands"

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4" />,
  facebook: <Facebook className="h-4 w-4" />,
  tiktok: <Smartphone className="h-4 w-4" />,
  youtube: <Youtube className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
}

const platformColors: Record<string, string> = {
  instagram: "text-pink-600 bg-pink-100",
  facebook: "text-blue-600 bg-blue-100",
  tiktok: "text-gray-900 bg-gray-100",
  youtube: "text-red-600 bg-red-100",
  linkedin: "text-blue-700 bg-blue-100",
}

const typeIcons: Record<string, React.ReactNode> = {
  imagen: <ImageIcon className="h-3 w-3" />,
  video: <Film className="h-3 w-3" />,
  reel: <Play className="h-3 w-3" />,
  carrusel: <LayoutGrid className="h-3 w-3" />,
  story: <Eye className="h-3 w-3" />,
  live: <Play className="h-3 w-3" />,
}

const pillarLabels: Record<string, string> = {
  producto: "Producto",
  lifestyle: "Lifestyle",
  social_proof: "Social Proof",
  educativo: "Educativo",
  behind_scenes: "Behind Scenes",
  promocional: "Promocional",
}

export default function OrganicRankingsPage() {
  const params = useParams()
  const brandId = params.id as string
  
  const [searchQuery, setSearchQuery] = useState("")
  const [platformFilter, setPlatformFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [pillarFilter, setPillarFilter] = useState("all")
  const [sortBy, setSortBy] = useState("engagement")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  
  const brand = mockBrands.find(b => b.id === brandId)
  const content = getBrandOrganicContent(brandId)
  
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

  // Filter and sort content
  const filteredContent = content
    .filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPlatform = platformFilter === "all" || c.platform === platformFilter
      const matchesType = typeFilter === "all" || c.type === typeFilter
      const matchesPillar = pillarFilter === "all" || c.pillar === pillarFilter
      return matchesSearch && matchesPlatform && matchesType && matchesPillar
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof OrganicContentPerformance] as number
      const bValue = b[sortBy as keyof OrganicContentPerformance] as number
      return sortOrder === "desc" ? bValue - aValue : aValue - bValue
    })

  // Get engagement status based on rate
  const getEngagementStatus = (rate: number) => {
    if (rate >= 7) return "excellent"
    if (rate >= 5) return "good"
    if (rate >= 3) return "warning"
    return "critical"
  }

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toString()
  }

  // Summary stats
  const totalReach = filteredContent.reduce((sum, c) => sum + c.reach, 0)
  const totalEngagement = filteredContent.reduce((sum, c) => sum + c.engagement, 0)
  const avgEngagementRate = filteredContent.length > 0 
    ? filteredContent.reduce((sum, c) => sum + c.engagementRate, 0) / filteredContent.length 
    : 0
  const topContent = filteredContent[0]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/orbit-marketing-intelligence/brands/${brandId}/analytics`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-pink-500" />
              Ranking de Contenido Orgánico
            </h1>
            <p className="text-muted-foreground">{brand.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/orbit-marketing-intelligence/brands/${brandId}/rankings/campaigns`}>
              Ver Campañas
            </Link>
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alcance Total</p>
                <p className="text-xl font-bold">{formatNumber(totalReach)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-100">
                <Heart className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Engagement Total</p>
                <p className="text-xl font-bold">{formatNumber(totalEngagement)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Engagement Rate Prom.</p>
                <p className="text-xl font-bold">{avgEngagementRate.toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-200">
                <Medal className="h-5 w-5 text-pink-700" />
              </div>
              <div>
                <p className="text-sm text-pink-700">Top Contenido</p>
                <p className="text-lg font-bold text-pink-900 truncate max-w-[150px]">
                  {topContent?.title || "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar contenido..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Plataforma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="imagen">Imagen</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="reel">Reel</SelectItem>
                  <SelectItem value="carrusel">Carrusel</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={pillarFilter} onValueChange={setPillarFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Pilar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="producto">Producto</SelectItem>
                  <SelectItem value="lifestyle">Lifestyle</SelectItem>
                  <SelectItem value="social_proof">Social Proof</SelectItem>
                  <SelectItem value="educativo">Educativo</SelectItem>
                  <SelectItem value="promocional">Promocional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Ordenar por:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="engagementRate">Tasa de Engagement</SelectItem>
                  <SelectItem value="reach">Alcance</SelectItem>
                  <SelectItem value="impressions">Impresiones</SelectItem>
                  <SelectItem value="shares">Compartidos</SelectItem>
                  <SelectItem value="saves">Guardados</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
              >
                {sortOrder === "desc" ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rankings Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Contenido</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Pilar</TableHead>
                <TableHead className="text-right">Alcance</TableHead>
                <TableHead className="text-right">Engagement</TableHead>
                <TableHead className="text-right">ER %</TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Heart className="h-3 w-3" />
                    <MessageCircle className="h-3 w-3" />
                    <Share2 className="h-3 w-3" />
                    <Bookmark className="h-3 w-3" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContent.map((item, index) => {
                const erStatus = getEngagementStatus(item.engagementRate)
                const platformColor = platformColors[item.platform] || "text-gray-600 bg-gray-100"
                
                return (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? "bg-amber-100 text-amber-700" :
                        index === 1 ? "bg-gray-200 text-gray-700" :
                        index === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium line-clamp-1">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.publishedAt).toLocaleDateString("es-MX", { 
                            day: "numeric", 
                            month: "short" 
                          })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={platformColor}>
                        {platformIcons[item.platform]}
                        <span className="ml-1 capitalize">{item.platform}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        {typeIcons[item.type]}
                        <span className="capitalize">{item.type}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.pillar && (
                        <Badge variant="outline" className="text-xs">
                          {pillarLabels[item.pillar] || item.pillar}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(item.reach)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatNumber(item.engagement)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span>{item.engagementRate.toFixed(1)}%</span>
                        <KPISemaphore status={erStatus} size="sm" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-3 text-xs text-muted-foreground">
                        <span>{formatNumber(item.likes)}</span>
                        <span>{formatNumber(item.comments)}</span>
                        <span>{formatNumber(item.shares)}</span>
                        <span>{formatNumber(item.saves)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              
              {filteredContent.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No se encontró contenido con los filtros aplicados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
