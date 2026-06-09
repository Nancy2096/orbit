"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { 
  Database, 
  Search, 
  Plus, 
  Download, 
  Upload,
  RefreshCw,
  Table as TableIcon,
  BarChart3,
  FileSpreadsheet,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash,
  Edit,
  Eye,
  Filter,
  Calendar,
  HardDrive,
  Layers,
  Activity
} from "lucide-react"

// Mock data tables
const mockDataTables = [
  {
    id: "dt1",
    name: "campaigns_meta",
    source: "Meta Ads",
    records: 125840,
    lastSync: "2026-05-18T10:30:00",
    status: "synced",
    schema: [
      { field: "campaign_id", type: "string", nullable: false },
      { field: "campaign_name", type: "string", nullable: false },
      { field: "spend", type: "number", nullable: false },
      { field: "impressions", type: "number", nullable: false },
      { field: "clicks", type: "number", nullable: false },
      { field: "conversions", type: "number", nullable: true },
      { field: "date", type: "date", nullable: false }
    ]
  },
  {
    id: "dt2",
    name: "campaigns_google",
    source: "Google Ads",
    records: 98520,
    lastSync: "2026-05-18T10:25:00",
    status: "synced",
    schema: [
      { field: "campaign_id", type: "string", nullable: false },
      { field: "campaign_name", type: "string", nullable: false },
      { field: "cost", type: "number", nullable: false },
      { field: "impressions", type: "number", nullable: false },
      { field: "clicks", type: "number", nullable: false },
      { field: "conversions", type: "number", nullable: true },
      { field: "date", type: "date", nullable: false }
    ]
  },
  {
    id: "dt3",
    name: "analytics_sessions",
    source: "Google Analytics",
    records: 542100,
    lastSync: "2026-05-18T10:20:00",
    status: "synced",
    schema: [
      { field: "session_id", type: "string", nullable: false },
      { field: "user_id", type: "string", nullable: true },
      { field: "source", type: "string", nullable: false },
      { field: "medium", type: "string", nullable: false },
      { field: "landing_page", type: "string", nullable: false },
      { field: "duration", type: "number", nullable: false },
      { field: "pageviews", type: "number", nullable: false },
      { field: "date", type: "date", nullable: false }
    ]
  },
  {
    id: "dt4",
    name: "leads_crm",
    source: "HubSpot",
    records: 15420,
    lastSync: "2026-05-18T09:00:00",
    status: "syncing",
    schema: [
      { field: "lead_id", type: "string", nullable: false },
      { field: "email", type: "string", nullable: false },
      { field: "name", type: "string", nullable: true },
      { field: "source", type: "string", nullable: false },
      { field: "status", type: "string", nullable: false },
      { field: "created_at", type: "date", nullable: false }
    ]
  },
  {
    id: "dt5",
    name: "social_metrics",
    source: "Meta Business",
    records: 45200,
    lastSync: "2026-05-17T18:00:00",
    status: "error",
    schema: [
      { field: "post_id", type: "string", nullable: false },
      { field: "platform", type: "string", nullable: false },
      { field: "likes", type: "number", nullable: false },
      { field: "comments", type: "number", nullable: false },
      { field: "shares", type: "number", nullable: false },
      { field: "reach", type: "number", nullable: false },
      { field: "date", type: "date", nullable: false }
    ]
  }
]

const mockQueryHistory = [
  {
    id: "q1",
    query: "SELECT campaign_name, SUM(spend) as total_spend FROM campaigns_meta GROUP BY campaign_name ORDER BY total_spend DESC LIMIT 10",
    executedAt: "2026-05-18T10:15:00",
    duration: 1.2,
    rows: 10,
    user: "admin@agency.com"
  },
  {
    id: "q2",
    query: "SELECT source, COUNT(*) as sessions FROM analytics_sessions WHERE date >= '2026-05-01' GROUP BY source",
    executedAt: "2026-05-18T09:45:00",
    duration: 2.5,
    rows: 8,
    user: "analyst@agency.com"
  },
  {
    id: "q3",
    query: "SELECT status, COUNT(*) as count FROM leads_crm GROUP BY status",
    executedAt: "2026-05-18T09:30:00",
    duration: 0.8,
    rows: 5,
    user: "admin@agency.com"
  }
]

export default function DataWarehousePage() {
  const [activeTab, setActiveTab] = useState("tables")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTable, setSelectedTable] = useState<typeof mockDataTables[0] | null>(null)
  const [showTableDetail, setShowTableDetail] = useState(false)
  const [sqlQuery, setSqlQuery] = useState("")
  const [queryResults, setQueryResults] = useState<any[] | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  const filteredTables = mockDataTables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.source.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "synced": return "bg-green-100 text-green-800"
      case "syncing": return "bg-blue-100 text-blue-800"
      case "error": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "synced": return <CheckCircle className="h-4 w-4" />
      case "syncing": return <RefreshCw className="h-4 w-4 animate-spin" />
      case "error": return <AlertCircle className="h-4 w-4" />
      default: return null
    }
  }

  const executeQuery = () => {
    setIsExecuting(true)
    // Simulate query execution
    setTimeout(() => {
      setQueryResults([
        { campaign_name: "Campaña Verano 2026", total_spend: 45000 },
        { campaign_name: "Brand Awareness", total_spend: 32000 },
        { campaign_name: "Conversiones Q2", total_spend: 28500 },
        { campaign_name: "Retargeting", total_spend: 15000 },
        { campaign_name: "Lookalike Audiences", total_spend: 12000 }
      ])
      setIsExecuting(false)
    }, 1500)
  }

  const totalRecords = mockDataTables.reduce((sum, t) => sum + t.records, 0)
  const syncedTables = mockDataTables.filter(t => t.status === "synced").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Warehouse</h1>
          <p className="text-muted-foreground">Gestiona y consulta todos tus datos de marketing</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sincronizar Todo
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockDataTables.length}</p>
                <p className="text-sm text-muted-foreground">Tablas de Datos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Layers className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(totalRecords / 1000).toFixed(0)}K</p>
                <p className="text-sm text-muted-foreground">Registros Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{syncedTables}/{mockDataTables.length}</p>
                <p className="text-sm text-muted-foreground">Tablas Sincronizadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <HardDrive className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">2.4 GB</p>
                <p className="text-sm text-muted-foreground">Almacenamiento Usado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tables" className="gap-2">
            <TableIcon className="h-4 w-4" />
            Tablas
          </TabsTrigger>
          <TabsTrigger value="query" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Consultas SQL
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar tablas..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por fuente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las fuentes</SelectItem>
                <SelectItem value="meta">Meta Ads</SelectItem>
                <SelectItem value="google">Google Ads</SelectItem>
                <SelectItem value="analytics">Google Analytics</SelectItem>
                <SelectItem value="hubspot">HubSpot</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead>Registros</TableHead>
                  <TableHead>Última Sincronización</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTables.map(table => (
                  <TableRow key={table.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TableIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{table.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{table.source}</TableCell>
                    <TableCell>{table.records.toLocaleString()}</TableCell>
                    <TableCell>
                      {new Date(table.lastSync).toLocaleString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge className={`gap-1 ${getStatusColor(table.status)}`}>
                        {getStatusIcon(table.status)}
                        {table.status === "synced" ? "Sincronizado" : table.status === "syncing" ? "Sincronizando" : "Error"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedTable(table)
                            setShowTableDetail(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="query" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Editor SQL</CardTitle>
              <CardDescription>Ejecuta consultas SQL personalizadas en tus datos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Consulta SQL</Label>
                <Textarea 
                  className="font-mono min-h-[150px]"
                  placeholder="SELECT * FROM campaigns_meta WHERE spend > 1000 ORDER BY spend DESC LIMIT 100"
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={executeQuery} disabled={!sqlQuery || isExecuting}>
                  {isExecuting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Ejecutando...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Ejecutar Consulta
                    </>
                  )}
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Resultados
                </Button>
              </div>

              {queryResults && (
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{queryResults.length} resultados</p>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(queryResults[0]).map(key => (
                            <TableHead key={key}>{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {queryResults.map((row, i) => (
                          <TableRow key={i}>
                            {Object.values(row).map((value: any, j) => (
                              <TableCell key={j}>
                                {typeof value === 'number' ? value.toLocaleString() : value}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Consultas</CardTitle>
              <CardDescription>Consultas SQL ejecutadas recientemente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockQueryHistory.map(query => (
                  <div key={query.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{query.user}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(query.executedAt).toLocaleString('es-MX')}
                      </p>
                    </div>
                    <pre className="text-sm font-mono bg-muted p-3 rounded overflow-x-auto">
                      {query.query}
                    </pre>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{query.rows} filas</span>
                      <span>{query.duration}s</span>
                      <Button variant="ghost" size="sm" onClick={() => setSqlQuery(query.query)}>
                        Usar esta consulta
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Table Detail Dialog */}
      <Dialog open={showTableDetail} onOpenChange={setShowTableDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TableIcon className="h-5 w-5" />
              {selectedTable?.name}
            </DialogTitle>
            <DialogDescription>
              Fuente: {selectedTable?.source} | {selectedTable?.records.toLocaleString()} registros
            </DialogDescription>
          </DialogHeader>
          
          {selectedTable && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Esquema de la Tabla</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nullable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTable.schema.map(field => (
                      <TableRow key={field.field}>
                        <TableCell className="font-mono text-sm">{field.field}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{field.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {field.nullable ? (
                            <span className="text-muted-foreground">Sí</span>
                          ) : (
                            <span className="text-amber-600">No</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTableDetail(false)}>
              Cerrar
            </Button>
            <Button onClick={() => {
              setSqlQuery(`SELECT * FROM ${selectedTable?.name} LIMIT 100`)
              setShowTableDetail(false)
              setActiveTab("query")
            }}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Consultar Tabla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
