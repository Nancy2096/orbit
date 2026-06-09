"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  ArrowLeft,
  FileText,
  Download,
  Share2,
  Calendar,
  Clock,
  CheckCircle,
  FileSpreadsheet,
  Presentation,
  FileType,
  Send,
  Eye,
  Plus,
  Sparkles,
  Loader2,
} from "lucide-react"
import { mockBrands } from "@/lib/marketing-intelligence/brand-mock-data"
import { mockExecutiveReports } from "@/lib/marketing-intelligence/brand-phase3-mock-data"

export default function BrandReportsPage() {
  const params = useParams()
  const brandId = params.id as string
  const brand = mockBrands.find(b => b.id === brandId)
  const reports = mockExecutiveReports.filter(r => r.brandId === brandId)
  
  const [selectedMonth, setSelectedMonth] = useState("4")
  const [selectedYear, setSelectedYear] = useState("2024")
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedSections, setSelectedSections] = useState<string[]>([
    'summary', 'kpis', 'campaigns', 'content', 'learnings', 'recommendations'
  ])
  
  if (!brand) {
    return <div className="p-8">Marca no encontrada</div>
  }

  const currentReport = reports.find(r => 
    r.month === parseInt(selectedMonth) && r.year === parseInt(selectedYear)
  )

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 3000))
    setIsGenerating(false)
    toast.success("Reporte generado exitosamente")
  }

  const handleExport = (format: string) => {
    toast.success(`Exportando a ${format}...`)
  }

  const sections = [
    { id: 'summary', label: 'Resumen Ejecutivo' },
    { id: 'kpis', label: 'KPIs y Métricas' },
    { id: 'campaigns', label: 'Ranking de Campañas' },
    { id: 'content', label: 'Contenido Orgánico' },
    { id: 'learnings', label: 'Aprendizajes' },
    { id: 'recommendations', label: 'Recomendaciones' },
  ]

  const months = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ]

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
              <FileText className="h-6 w-6" />
              Centro de Reportes
            </h1>
            <p className="text-muted-foreground">{brand.name} - Reportes ejecutivos mensuales</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Report Builder */}
        <div className="col-span-2 space-y-6">
          {/* Period Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Generar Reporte</CardTitle>
              <CardDescription>Selecciona el período y las secciones a incluir</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <Label>Mes</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Año</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Secciones a incluir</Label>
                <div className="grid grid-cols-2 gap-3">
                  {sections.map(section => (
                    <div key={section.id} className="flex items-center gap-2">
                      <Checkbox 
                        id={section.id}
                        checked={selectedSections.includes(section.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSections(prev => [...prev, section.id])
                          } else {
                            setSelectedSections(prev => prev.filter(s => s !== section.id))
                          }
                        }}
                      />
                      <Label htmlFor={section.id} className="font-normal cursor-pointer">
                        {section.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleGenerateReport}
                disabled={isGenerating || selectedSections.length === 0}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando con IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generar Reporte con IA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Current Report Preview */}
          {currentReport && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Reporte {currentReport.period}</CardTitle>
                    <CardDescription>
                      {currentReport.status === 'approved' && 'Aprobado'}
                      {currentReport.status === 'generated' && 'Generado - Pendiente de revisión'}
                      {currentReport.status === 'sent' && 'Enviado al cliente'}
                    </CardDescription>
                  </div>
                  <Badge variant={
                    currentReport.status === 'sent' ? 'default' :
                    currentReport.status === 'approved' ? 'secondary' : 'outline'
                  }>
                    {currentReport.status === 'sent' ? 'Enviado' :
                     currentReport.status === 'approved' ? 'Aprobado' : 'Borrador'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div>
                  <h4 className="font-semibold mb-2">Resumen Ejecutivo</h4>
                  <p className="text-sm text-muted-foreground">{currentReport.summary}</p>
                </div>

                {/* Highlights */}
                <div>
                  <h4 className="font-semibold mb-2">Highlights del Mes</h4>
                  <ul className="space-y-1">
                    {currentReport.highlights.map((highlight, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* KPIs */}
                <div>
                  <h4 className="font-semibold mb-2">KPIs Principales</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {currentReport.kpis.slice(0, 6).map((kpi) => (
                      <div key={kpi.code} className="p-3 rounded-lg border">
                        <p className="text-xs text-muted-foreground">{kpi.name}</p>
                        <p className="text-lg font-bold">{kpi.value.toLocaleString()}</p>
                        <div className="flex items-center gap-1 text-xs">
                          <span className={kpi.variance >= 0 ? "text-green-600" : "text-red-600"}>
                            {kpi.variance >= 0 ? "+" : ""}{kpi.variance.toFixed(1)}%
                          </span>
                          <span className="text-muted-foreground">vs objetivo</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => handleExport('PDF')}>
                    <FileType className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('Google Sheets')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Sheets
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('Google Slides')}>
                    <Presentation className="h-4 w-4 mr-2" />
                    Slides
                  </Button>
                  <div className="flex-1" />
                  <Button>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar al Cliente
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Reports History */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de Reportes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reports.map((report) => (
                <div 
                  key={report.id} 
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                    report.month === parseInt(selectedMonth) && report.year === parseInt(selectedYear)
                      ? 'border-primary bg-primary/5'
                      : ''
                  }`}
                  onClick={() => {
                    setSelectedMonth(report.month.toString())
                    setSelectedYear(report.year.toString())
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{report.period}</span>
                    <Badge variant="outline" className="text-xs">
                      {report.status === 'sent' ? 'Enviado' :
                       report.status === 'approved' ? 'Aprobado' : 'Borrador'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(report.createdAt).toLocaleDateString('es-MX')}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Exportar a Looker Studio</CardTitle>
              <CardDescription className="text-xs">
                Conecta tus datos con Looker Studio para dashboards personalizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Conectar con Looker
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
