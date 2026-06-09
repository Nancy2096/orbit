"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Sparkles,
  Search,
  Clock,
  Zap,
  DollarSign,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Users,
  Lightbulb,
  BarChart3,
  Filter,
  Download,
} from "lucide-react"
import { mockBrands } from "@/lib/marketing-intelligence/brand-mock-data"
import { mockAILogs } from "@/lib/marketing-intelligence/brand-phase3-mock-data"

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  insight: { icon: <Lightbulb className="h-4 w-4" />, label: 'Insight', color: 'text-amber-600 bg-amber-50' },
  persona: { icon: <Users className="h-4 w-4" />, label: 'Persona', color: 'text-purple-600 bg-purple-50' },
  recommendation: { icon: <Sparkles className="h-4 w-4" />, label: 'Recomendación', color: 'text-blue-600 bg-blue-50' },
  report: { icon: <FileText className="h-4 w-4" />, label: 'Reporte', color: 'text-green-600 bg-green-50' },
  content: { icon: <FileText className="h-4 w-4" />, label: 'Contenido', color: 'text-pink-600 bg-pink-50' },
  brief: { icon: <BarChart3 className="h-4 w-4" />, label: 'Brief', color: 'text-indigo-600 bg-indigo-50' },
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  success: { icon: <CheckCircle className="h-4 w-4" />, label: 'Exitoso', color: 'text-green-600' },
  error: { icon: <XCircle className="h-4 w-4" />, label: 'Error', color: 'text-red-600' },
  partial: { icon: <AlertCircle className="h-4 w-4" />, label: 'Parcial', color: 'text-amber-600' },
}

export default function BrandAILogsPage() {
  const params = useParams()
  const brandId = params.id as string
  const brand = mockBrands.find(b => b.id === brandId)
  const logs = mockAILogs.filter(l => l.brandId === brandId)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedLog, setSelectedLog] = useState<typeof logs[0] | null>(null)
  
  if (!brand) {
    return <div className="p-8">Marca no encontrada</div>
  }

  const filteredLogs = logs.filter(log => {
    if (filterType !== 'all' && log.type !== filterType) return false
    if (filterStatus !== 'all' && log.status !== filterStatus) return false
    if (searchQuery && !log.prompt.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // Stats
  const totalTokens = logs.reduce((sum, l) => sum + l.tokens, 0)
  const totalCost = logs.reduce((sum, l) => sum + (l.cost || 0), 0)
  const avgDuration = logs.length > 0 
    ? logs.reduce((sum, l) => sum + l.duration, 0) / logs.length 
    : 0
  const successRate = logs.length > 0 
    ? (logs.filter(l => l.status === 'success').length / logs.length) * 100 
    : 0

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/orbit-marketing-intelligence/brands/${brandId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              Registro de IA
            </h1>
            <p className="text-muted-foreground">{brand.name} - Historial de generaciones con IA</p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar Logs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{logs.length}</p>
                <p className="text-xs text-muted-foreground">Generaciones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(totalTokens / 1000).toFixed(1)}k</p>
                <p className="text-xs text-muted-foreground">Tokens usados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Costo total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <CheckCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{successRate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Tasa de éxito</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar en prompts..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="insight">Insights</SelectItem>
                <SelectItem value="persona">Personas</SelectItem>
                <SelectItem value="recommendation">Recomendaciones</SelectItem>
                <SelectItem value="report">Reportes</SelectItem>
                <SelectItem value="content">Contenido</SelectItem>
                <SelectItem value="brief">Brief</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="success">Exitoso</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="partial">Parcial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No hay registros</p>
              <p className="text-muted-foreground">No se encontraron generaciones que coincidan con los filtros</p>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => {
            const type = typeConfig[log.type]
            const status = statusConfig[log.status]
            
            return (
              <Card key={log.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${type.color}`}>
                        {type.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{type.label}</Badge>
                          <span className={`flex items-center gap-1 text-xs ${status.color}`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-2 text-muted-foreground">{log.prompt}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(log.createdAt).toLocaleString('es-MX')}
                          </span>
                          <span>{log.model}</span>
                          <span>{log.tokens.toLocaleString()} tokens</span>
                          <span>{log.duration}ms</span>
                          {log.cost && <span>${log.cost.toFixed(4)}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <span className={`p-1.5 rounded ${type.color}`}>{type.icon}</span>
                            Detalle de Generación
                          </DialogTitle>
                          <DialogDescription>
                            {new Date(log.createdAt).toLocaleString('es-MX')} - {log.model}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Prompt</h4>
                            <div className="p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap">
                              {log.prompt}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Respuesta</h4>
                            <div className="p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                              {log.response}
                            </div>
                          </div>
                          {log.error && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2 text-red-600">Error</h4>
                              <div className="p-3 rounded-lg bg-red-50 text-sm text-red-700">
                                {log.error}
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
                            <span>Tokens: {log.tokens.toLocaleString()}</span>
                            <span>Duración: {log.duration}ms</span>
                            {log.cost && <span>Costo: ${log.cost.toFixed(4)}</span>}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
