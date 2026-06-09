"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  MessageSquare,
  Eye,
  Image as ImageIcon,
  Video,
  Send,
  RotateCcw,
  Filter,
  Search,
  ChevronRight,
  History,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  User,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { mockSocialPosts, mockApprovals } from "@/lib/marketing-intelligence/mock-data-phase2"
import type { Approval, ApprovalStatus, SocialPost, Comment } from "@/lib/marketing-intelligence/types-phase2"

// Network icons
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
}

const networkColors: Record<string, string> = {
  instagram: "#E4405F",
  facebook: "#1877F2",
  tiktok: "#000000",
  linkedin: "#0A66C2",
  youtube: "#FF0000",
}

const approvalStatusConfig: Record<ApprovalStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pendiente: { label: "Pendiente", color: "bg-amber-500", icon: Clock },
  aprobado: { label: "Aprobado", color: "bg-green-500", icon: CheckCircle },
  rechazado: { label: "Rechazado", color: "bg-red-500", icon: XCircle },
  cambios_solicitados: { label: "Cambios Solicitados", color: "bg-orange-500", icon: AlertTriangle },
}

const priorityConfig = {
  alta: { label: "Alta", color: "bg-red-500" },
  media: { label: "Media", color: "bg-amber-500" },
  baja: { label: "Baja", color: "bg-green-500" },
}

// Generate more mock approvals from posts
const generateApprovals = (): Approval[] => {
  const postsForApproval = mockSocialPosts.filter(p => 
    p.status === "en_revision" || p.status === "aprobado" || p.status === "rechazado"
  )
  
  return [
    ...mockApprovals,
    ...postsForApproval.map((post, index) => ({
      id: `approval-gen-${index}`,
      postId: post.id,
      post,
      status: post.status === "aprobado" ? "aprobado" as ApprovalStatus : 
              post.status === "rechazado" ? "rechazado" as ApprovalStatus : 
              "pendiente" as ApprovalStatus,
      priority: ["alta", "media", "baja"][index % 3] as "alta" | "media" | "baja",
      requestedBy: post.copyResponsible || "María García",
      requestedAt: post.updatedAt,
      reviewedBy: post.status !== "en_revision" ? "Roberto Sánchez" : undefined,
      reviewedAt: post.status !== "en_revision" ? post.updatedAt : undefined,
      comments: post.clientComments,
      currentVersion: post,
    }))
  ]
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>(generateApprovals())
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterClient, setFilterClient] = useState<string>("all")
  const [filterNetwork, setFilterNetwork] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [newComment, setNewComment] = useState("")
  const [activeTab, setActiveTab] = useState("pendiente")

  // Filter approvals
  const filteredApprovals = approvals.filter(approval => {
    if (filterStatus !== "all" && approval.status !== filterStatus) return false
    if (filterNetwork !== "all" && !approval.post.networks.includes(filterNetwork as any)) return false
    if (searchQuery && !approval.post.copy.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // Group by status
  const pendingApprovals = filteredApprovals.filter(a => a.status === "pendiente")
  const approvedApprovals = filteredApprovals.filter(a => a.status === "aprobado")
  const rejectedApprovals = filteredApprovals.filter(a => a.status === "rechazado")
  const changesApprovals = filteredApprovals.filter(a => a.status === "cambios_solicitados")

  // Handle approval action
  const handleApprovalAction = (approvalId: string, newStatus: ApprovalStatus, comment?: string) => {
    setApprovals(prev => prev.map(a => {
      if (a.id === approvalId) {
        const newComments = comment ? [
          ...a.comments,
          {
            id: `comment-${Date.now()}`,
            authorId: "current-user",
            authorName: "Usuario Actual",
            authorAvatar: "/avatars/user.jpg",
            text: comment,
            createdAt: new Date().toISOString(),
            isClient: false
          }
        ] : a.comments

        return {
          ...a,
          status: newStatus,
          reviewedBy: "Usuario Actual",
          reviewedAt: new Date().toISOString(),
          comments: newComments
        }
      }
      return a
    }))
    setShowDetailDialog(false)
    setNewComment("")
  }

  // Add comment
  const handleAddComment = (approvalId: string) => {
    if (!newComment.trim()) return
    
    setApprovals(prev => prev.map(a => {
      if (a.id === approvalId) {
        return {
          ...a,
          comments: [
            ...a.comments,
            {
              id: `comment-${Date.now()}`,
              authorId: "current-user",
              authorName: "Usuario Actual",
              authorAvatar: "/avatars/user.jpg",
              text: newComment,
              createdAt: new Date().toISOString(),
              isClient: false
            }
          ]
        }
      }
      return a
    }))
    setNewComment("")
  }

  const renderApprovalRow = (approval: Approval) => {
    const StatusIcon = approvalStatusConfig[approval.status].icon
    return (
      <TableRow 
        key={approval.id}
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => {
          setSelectedApproval(approval)
          setShowDetailDialog(true)
        }}
      >
        <TableCell>
          <div className="max-w-[250px]">
            <p className="font-medium truncate">{approval.post.copy}</p>
            <p className="text-xs text-muted-foreground">{approval.post.brandName}</p>
          </div>
        </TableCell>
        <TableCell>
          <p className="text-sm">{approval.post.clientName}</p>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            {approval.post.networks.slice(0, 3).map(network => {
              const Icon = networkIcons[network]
              return Icon ? (
                <div
                  key={network}
                  className="flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${networkColors[network]}20` }}
                >
                  <Icon className="h-3 w-3" style={{ color: networkColors[network] }} />
                </div>
              ) : null
            })}
            {approval.post.networks.length > 3 && (
              <span className="text-xs text-muted-foreground">+{approval.post.networks.length - 3}</span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm">
            <p>{approval.post.scheduledDate}</p>
            <p className="text-muted-foreground">{approval.post.scheduledTime}</p>
          </div>
        </TableCell>
        <TableCell>
          <p className="text-sm">{approval.requestedBy}</p>
        </TableCell>
        <TableCell>
          <Badge className={cn("gap-1", approvalStatusConfig[approval.status].color, "text-white")}>
            <StatusIcon className="h-3 w-3" />
            {approvalStatusConfig[approval.status].label}
          </Badge>
        </TableCell>
        <TableCell>
          {approval.comments.length > 0 ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {approval.comments.length}
            </div>
          ) : "-"}
        </TableCell>
        <TableCell>
          <Badge 
            variant="outline" 
            className={cn(
              priorityConfig[approval.priority].color.replace("bg-", "border-"),
              priorityConfig[approval.priority].color.replace("bg-", "text-")
            )}
          >
            {priorityConfig[approval.priority].label}
          </Badge>
        </TableCell>
        <TableCell>
          <Button variant="ghost" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Aprobaciones</h1>
          <p className="text-muted-foreground">Gestiona las aprobaciones de contenido de clientes y agencia</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={cn(activeTab === "pendiente" && "ring-2 ring-primary")}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{pendingApprovals.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(activeTab === "aprobado" && "ring-2 ring-primary")}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aprobadas</p>
                <p className="text-2xl font-bold">{approvedApprovals.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(activeTab === "rechazado" && "ring-2 ring-primary")}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rechazadas</p>
                <p className="text-2xl font-bold">{rejectedApprovals.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(activeTab === "cambios" && "ring-2 ring-primary")}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Con Cambios</p>
                <p className="text-2xl font-bold">{changesApprovals.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar publicaciones..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterNetwork} onValueChange={setFilterNetwork}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Red social" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las redes</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Approvals Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="pendiente" className="gap-2">
            <Clock className="h-4 w-4" />
            Pendientes
          </TabsTrigger>
          <TabsTrigger value="aprobado" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Aprobadas
          </TabsTrigger>
          <TabsTrigger value="rechazado" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rechazadas
          </TabsTrigger>
          <TabsTrigger value="cambios" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Cambios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendiente">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Publicación</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Red Social</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Solicitado por</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Comentarios</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApprovals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No hay aprobaciones pendientes
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingApprovals.map(renderApprovalRow)
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aprobado">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Publicación</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Red Social</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Solicitado por</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Comentarios</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedApprovals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No hay aprobaciones en este estado
                      </TableCell>
                    </TableRow>
                  ) : (
                    approvedApprovals.map(renderApprovalRow)
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rechazado">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Publicación</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Red Social</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Solicitado por</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Comentarios</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rejectedApprovals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No hay aprobaciones rechazadas
                      </TableCell>
                    </TableRow>
                  ) : (
                    rejectedApprovals.map(renderApprovalRow)
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cambios">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Publicación</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Red Social</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Solicitado por</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Comentarios</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {changesApprovals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No hay aprobaciones con cambios solicitados
                      </TableCell>
                    </TableRow>
                  ) : (
                    changesApprovals.map(renderApprovalRow)
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedApproval && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>Detalle de Aprobación</DialogTitle>
                    <DialogDescription>
                      {selectedApproval.post.brandName} - {selectedApproval.post.clientName}
                    </DialogDescription>
                  </div>
                  <Badge className={cn("gap-1", approvalStatusConfig[selectedApproval.status].color, "text-white")}>
                    {approvalStatusConfig[selectedApproval.status].label}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="grid gap-6 md:grid-cols-2 py-4">
                {/* Post Preview */}
                <div className="space-y-4">
                  <h4 className="font-medium">Vista Previa</h4>
                  <div className="aspect-square rounded-lg bg-muted flex items-center justify-center border">
                    {selectedApproval.post.mediaType === "video" ? (
                      <Video className="h-16 w-16 text-muted-foreground" />
                    ) : (
                      <ImageIcon className="h-16 w-16 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Networks */}
                  <div className="flex flex-wrap gap-2">
                    {selectedApproval.post.networks.map(network => {
                      const Icon = networkIcons[network]
                      return (
                        <Badge key={network} variant="outline" className="gap-1">
                          {Icon && <Icon className="h-3 w-3" />}
                          <span className="capitalize">{network}</span>
                        </Badge>
                      )
                    })}
                  </div>

                  {/* Copy */}
                  <div>
                    <h5 className="text-sm font-medium mb-1">Copy</h5>
                    <p className="text-sm">{selectedApproval.post.copy}</p>
                  </div>

                  {/* Caption */}
                  <div>
                    <h5 className="text-sm font-medium mb-1">Caption</h5>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedApproval.post.caption || "Sin caption"}
                    </p>
                  </div>

                  {/* Hashtags */}
                  {selectedApproval.post.hashtags.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium mb-1">Hashtags</h5>
                      <div className="flex flex-wrap gap-1">
                        {selectedApproval.post.hashtags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Details and Comments */}
                <div className="space-y-4">
                  {/* Info */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Información</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Formato</p>
                        <p className="font-medium capitalize">{selectedApproval.post.format}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Prioridad</p>
                        <Badge variant="outline" className={cn(
                          priorityConfig[selectedApproval.priority].color.replace("bg-", "border-"),
                          priorityConfig[selectedApproval.priority].color.replace("bg-", "text-")
                        )}>
                          {priorityConfig[selectedApproval.priority].label}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Fecha programada</p>
                        <p className="font-medium">{selectedApproval.post.scheduledDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Hora</p>
                        <p className="font-medium">{selectedApproval.post.scheduledTime}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Solicitado por</p>
                        <p className="font-medium">{selectedApproval.requestedBy}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Fecha solicitud</p>
                        <p className="font-medium">
                          {new Date(selectedApproval.requestedAt).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                      {selectedApproval.reviewedBy && (
                        <>
                          <div>
                            <p className="text-muted-foreground">Revisado por</p>
                            <p className="font-medium">{selectedApproval.reviewedBy}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fecha revisión</p>
                            <p className="font-medium">
                              {selectedApproval.reviewedAt && new Date(selectedApproval.reviewedAt).toLocaleDateString('es-MX')}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Comments */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Comentarios ({selectedApproval.comments.length})
                    </h4>
                    
                    <ScrollArea className="h-48 border rounded-lg p-3">
                      {selectedApproval.comments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No hay comentarios aún
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {selectedApproval.comments.map(comment => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {comment.authorName.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{comment.authorName}</span>
                                  {comment.isClient && (
                                    <Badge variant="outline" className="text-[10px]">Cliente</Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(comment.createdAt).toLocaleString('es-MX')}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{comment.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>

                    {/* Add Comment */}
                    <div className="flex gap-2">
                      <Textarea 
                        placeholder="Agregar un comentario..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAddComment(selectedApproval.id)}
                      disabled={!newComment.trim()}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Comentario
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                  Cerrar
                </Button>
                
                {selectedApproval.status === "pendiente" && (
                  <>
                    <Button 
                      variant="outline" 
                      className="text-orange-600 hover:text-orange-700"
                      onClick={() => handleApprovalAction(selectedApproval.id, "cambios_solicitados", newComment || "Se solicitan cambios")}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Solicitar Cambios
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => handleApprovalAction(selectedApproval.id, "rechazado", newComment || "Rechazado")}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Rechazar
                    </Button>
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprovalAction(selectedApproval.id, "aprobado", newComment || "Aprobado")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Aprobar
                    </Button>
                  </>
                )}

                {selectedApproval.status === "cambios_solicitados" && (
                  <Button 
                    variant="outline"
                    onClick={() => handleApprovalAction(selectedApproval.id, "pendiente")}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Volver a Revisión
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
