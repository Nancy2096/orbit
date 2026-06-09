"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  CheckCircle2, XCircle, AlertCircle, Clock, 
  MessageCircle, Eye, Filter, Download, RefreshCw,
  Instagram, Facebook, Linkedin, Youtube, Twitter,
  Image, Video, Play, ChevronRight, History,
  ThumbsUp, ThumbsDown, Edit2, Send, User
} from "lucide-react"
import { mockApprovals, mockSocialPosts } from "@/lib/marketing-intelligence/mock-data-phase2"
import type { Approval, ApprovalStatus, SocialNetwork } from "@/lib/marketing-intelligence/types-phase2"

const networkIcons: Record<SocialNetwork, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  twitter: Twitter,
  tiktok: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
  ),
  pinterest: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0a12 12 0 00-4.37 23.17c-.1-.94-.2-2.4.04-3.44l1.43-6.07s-.37-.74-.37-1.83c0-1.71.99-2.99 2.23-2.99 1.05 0 1.56.79 1.56 1.74 0 1.06-.68 2.64-1.03 4.1-.29 1.24.62 2.25 1.84 2.25 2.21 0 3.91-2.33 3.91-5.69 0-2.98-2.14-5.06-5.2-5.06-3.54 0-5.62 2.66-5.62 5.41 0 1.07.41 2.22.93 2.85a.37.37 0 01.09.36l-.35 1.41c-.05.23-.18.27-.42.17-1.56-.73-2.54-3.01-2.54-4.85 0-3.95 2.87-7.58 8.27-7.58 4.35 0 7.73 3.1 7.73 7.24 0 4.32-2.72 7.79-6.51 7.79-1.27 0-2.47-.66-2.88-1.44l-.78 2.99c-.28 1.09-1.05 2.45-1.56 3.28A12 12 0 1012 0z" />
    </svg>
  ),
  threads: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  bluesky: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
}

const networkColors: Record<SocialNetwork, string> = {
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

const statusConfig: Record<ApprovalStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pendiente: { label: "Pendiente", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300", icon: Clock },
  aprobado: { label: "Aprobado", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", icon: CheckCircle2 },
  rechazado: { label: "Rechazado", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", icon: XCircle },
  cambios_solicitados: { label: "Cambios solicitados", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", icon: Edit2 },
}

const priorityConfig = {
  alta: { label: "Alta", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  media: { label: "Media", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  baja: { label: "Baja", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
}

// Extended mock approvals
const extendedApprovals: Approval[] = [
  ...mockApprovals,
  {
    id: 'approval-3',
    postId: 'post-5',
    post: mockSocialPosts.find(p => p.id === 'post-5')!,
    status: 'pendiente',
    priority: 'media',
    requestedBy: 'María García',
    requestedAt: '2024-01-18T14:00:00Z',
    comments: [],
    currentVersion: mockSocialPosts.find(p => p.id === 'post-5')!,
  },
  {
    id: 'approval-4',
    postId: 'post-6',
    post: mockSocialPosts.find(p => p.id === 'post-6')!,
    status: 'cambios_solicitados',
    priority: 'baja',
    requestedBy: 'Laura Hernández',
    requestedAt: '2024-01-16T10:00:00Z',
    reviewedBy: 'Roberto Sánchez',
    reviewedAt: '2024-01-17T11:00:00Z',
    comments: [
      { id: 'ac2', authorId: 'u4', authorName: 'Roberto Sánchez', authorAvatar: '', text: 'El copy necesita ser más directo. Reducir a 100 caracteres.', createdAt: '2024-01-17T11:00:00Z', isClient: true }
    ],
    currentVersion: mockSocialPosts.find(p => p.id === 'post-6')!,
  },
]

export default function AprobacionesPage() {
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedClient, setSelectedClient] = useState("all")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [comment, setComment] = useState("")
  const [activeTab, setActiveTab] = useState("pendientes")

  const filteredApprovals = extendedApprovals.filter(approval => {
    if (selectedStatus !== "all" && approval.status !== selectedStatus) return false
    if (selectedClient !== "all" && approval.post.clientId !== selectedClient) return false
    if (selectedPriority !== "all" && approval.priority !== selectedPriority) return false
    if (activeTab === "pendientes" && approval.status !== "pendiente") return false
    if (activeTab === "historial" && approval.status === "pendiente") return false
    return true
  })

  const pendingCount = extendedApprovals.filter(a => a.status === "pendiente").length
  const approvedCount = extendedApprovals.filter(a => a.status === "aprobado").length
  const rejectedCount = extendedApprovals.filter(a => a.status === "rechazado").length
  const changesCount = extendedApprovals.filter(a => a.status === "cambios_solicitados").length

  const handleApprove = () => {
    console.log("Approving:", selectedApproval?.id)
    setIsDetailOpen(false)
  }

  const handleReject = () => {
    console.log("Rejecting:", selectedApproval?.id)
    setIsDetailOpen(false)
  }

  const handleRequestChanges = () => {
    console.log("Requesting changes:", selectedApproval?.id, comment)
    setComment("")
    setIsDetailOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Aprobaciones</h1>
          <p className="text-muted-foreground">Gestiona las aprobaciones de contenido cliente/agencia</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={activeTab === "pendientes" ? "ring-2 ring-primary" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedCount}</p>
                <p className="text-xs text-muted-foreground">Aprobadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rejectedCount}</p>
                <p className="text-xs text-muted-foreground">Rechazadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Edit2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{changesCount}</p>
                <p className="text-xs text-muted-foreground">Con cambios</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pendientes" className="gap-2">
              <Clock className="h-4 w-4" />
              Pendientes
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="historial" className="gap-2">
              <History className="h-4 w-4" />
              Historial
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              <SelectItem value="client-1">Grupo Inmobiliario</SelectItem>
              <SelectItem value="client-2">Urbania Desarrollos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
            </SelectContent>
          </Select>

          {activeTab === "historial" && (
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="aprobado">Aprobados</SelectItem>
                <SelectItem value="rechazado">Rechazados</SelectItem>
                <SelectItem value="cambios_solicitados">Con cambios</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Approvals List */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Publicación</TableHead>
                <TableHead>Cliente / Marca</TableHead>
                <TableHead>Red Social</TableHead>
                <TableHead>Fecha Programada</TableHead>
                <TableHead>Solicitado por</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApprovals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No hay aprobaciones {activeTab === "pendientes" ? "pendientes" : "en el historial"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredApprovals.map((approval) => {
                  const StatusIcon = statusConfig[approval.status].icon
                  return (
                    <TableRow key={approval.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                      setSelectedApproval(approval)
                      setIsDetailOpen(true)
                    }}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            {approval.post.mediaType === "video" ? (
                              <Play className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <Image className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate max-w-[200px]">{approval.post.copy}</p>
                            <p className="text-xs text-muted-foreground capitalize">{approval.post.format}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{approval.post.clientName}</p>
                          <p className="text-xs text-muted-foreground">{approval.post.brandName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {approval.post.networks.slice(0, 3).map(network => {
                            const Icon = networkIcons[network]
                            return <Icon key={network} className="h-4 w-4" style={{ color: networkColors[network] }} />
                          })}
                          {approval.post.networks.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{approval.post.networks.length - 3}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{approval.post.scheduledDate}</p>
                          <p className="text-xs text-muted-foreground">{approval.post.scheduledTime}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">{approval.requestedBy.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{approval.requestedBy}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={priorityConfig[approval.priority].color}>
                          {priorityConfig[approval.priority].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`gap-1 ${statusConfig[approval.status].color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[approval.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approval Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedApproval && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>Revisión de Publicación</DialogTitle>
                    <DialogDescription>
                      {selectedApproval.post.brandName} - {selectedApproval.post.clientName}
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={priorityConfig[selectedApproval.priority].color}>
                      Prioridad: {priorityConfig[selectedApproval.priority].label}
                    </Badge>
                    <Badge className={statusConfig[selectedApproval.status].color}>
                      {statusConfig[selectedApproval.status].label}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid gap-6 md:grid-cols-2 py-4">
                {/* Preview */}
                <div className="space-y-4">
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                    {selectedApproval.post.mediaType === "video" ? (
                      <div className="text-center">
                        <Play className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Vista previa de video</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Image className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Vista previa de imagen</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground">Redes sociales:</Label>
                    <div className="flex gap-1">
                      {selectedApproval.post.networks.map(network => {
                        const Icon = networkIcons[network]
                        return (
                          <div key={network} className="p-1.5 rounded-lg border">
                            <Icon className="h-5 w-5" style={{ color: networkColors[network] }} />
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Fecha programada:</span>
                    <span className="font-medium">{selectedApproval.post.scheduledDate} a las {selectedApproval.post.scheduledTime}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Copy</Label>
                    <p className="mt-1 p-3 bg-muted rounded-lg">{selectedApproval.post.copy}</p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Caption</Label>
                    <p className="mt-1 p-3 bg-muted rounded-lg whitespace-pre-wrap text-sm">{selectedApproval.post.caption}</p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Hashtags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedApproval.post.hashtags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Comments Section */}
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-2 mb-3">
                      <MessageCircle className="h-4 w-4" />
                      Comentarios ({selectedApproval.comments.length})
                    </Label>
                    
                    {selectedApproval.comments.length > 0 ? (
                      <ScrollArea className="h-[150px] pr-4">
                        <div className="space-y-3">
                          {selectedApproval.comments.map(c => (
                            <div key={c.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">{c.authorName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{c.authorName}</span>
                                  <Badge variant="outline" className="text-[10px]">
                                    {c.isClient ? "Cliente" : "Agencia"}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(c.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm mt-1">{c.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Sin comentarios</p>
                    )}
                  </div>

                  {selectedApproval.status === "pendiente" && (
                    <div>
                      <Label>Agregar comentario</Label>
                      <Textarea 
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Escribe un comentario o feedback..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2">
                {selectedApproval.status === "pendiente" ? (
                  <>
                    <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                      Cancelar
                    </Button>
                    <Button variant="outline" onClick={handleRequestChanges} disabled={!comment.trim()}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Solicitar Cambios
                    </Button>
                    <Button variant="destructive" onClick={handleReject}>
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Rechazar
                    </Button>
                    <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Aprobar
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                    Cerrar
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
