"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  MessageCircle, Send, Search, Filter, RefreshCw,
  Instagram, Facebook, Linkedin, Youtube, Twitter,
  User, Clock, Tag, AlertTriangle, CheckCircle2,
  Star, Archive, Trash2, MoreVertical, Reply,
  ThumbsUp, ThumbsDown, Meh, Zap, UserPlus,
  Phone, Mail, ExternalLink, History, MessageSquare,
  ArrowUpRight, ChevronRight, Play
} from "lucide-react"
import { mockConversations, mockQuickReplies } from "@/lib/marketing-intelligence/mock-data-phase2"
import type { Conversation, ConversationStatus, ConversationTag, Sentiment, SocialNetwork } from "@/lib/marketing-intelligence/types-phase2"

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
  pinterest: ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>,
  threads: ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>,
  bluesky: ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>,
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

const statusConfig: Record<ConversationStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  nuevo: { label: "Nuevo", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", icon: MessageCircle },
  en_proceso: { label: "En proceso", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300", icon: Clock },
  respondido: { label: "Respondido", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", icon: CheckCircle2 },
  cerrado: { label: "Cerrado", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: Archive },
  escalado: { label: "Escalado", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", icon: AlertTriangle },
}

const sentimentConfig: Record<Sentiment, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  positivo: { label: "Positivo", color: "text-green-600", icon: ThumbsUp },
  neutral: { label: "Neutral", color: "text-slate-500", icon: Meh },
  negativo: { label: "Negativo", color: "text-red-600", icon: ThumbsDown },
  urgente: { label: "Urgente", color: "text-orange-600", icon: Zap },
}

const tagConfig: Record<ConversationTag, { label: string; color: string }> = {
  lead: { label: "Lead", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  queja: { label: "Queja", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  positivo: { label: "Positivo", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  informacion: { label: "Información", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  urgente: { label: "Urgente", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  spam: { label: "Spam", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  cliente_actual: { label: "Cliente actual", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  prospecto: { label: "Prospecto", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300" },
  reputacion: { label: "Reputación", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
}

export default function InboxPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(mockConversations[0])
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedNetwork, setSelectedNetwork] = useState("all")
  const [selectedSentiment, setSelectedSentiment] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [replyText, setReplyText] = useState("")
  const [showQuickReplies, setShowQuickReplies] = useState(false)

  const filteredConversations = mockConversations.filter(conv => {
    if (selectedStatus !== "all" && conv.status !== selectedStatus) return false
    if (selectedNetwork !== "all" && conv.network !== selectedNetwork) return false
    if (selectedSentiment !== "all" && conv.sentiment !== selectedSentiment) return false
    if (searchQuery && !conv.userName.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !conv.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))) return false
    return true
  })

  const newCount = mockConversations.filter(c => c.status === "nuevo").length
  const inProcessCount = mockConversations.filter(c => c.status === "en_proceso").length
  const urgentCount = mockConversations.filter(c => c.sentiment === "urgente" || c.tags.includes("urgente")).length

  const handleSendReply = () => {
    if (!replyText.trim()) return
    console.log("Sending reply:", replyText)
    setReplyText("")
  }

  const handleQuickReply = (text: string) => {
    setReplyText(text)
    setShowQuickReplies(false)
  }

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Inbox Unificado</h1>
          <p className="text-muted-foreground">Gestiona mensajes y comentarios de todas las redes</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <MessageCircle className="h-3 w-3" />
            {newCount} nuevos
          </Badge>
          <Badge variant="outline" className="gap-1 text-orange-600">
            <AlertTriangle className="h-3 w-3" />
            {urgentCount} urgentes
          </Badge>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Conversations List */}
        <Card className="col-span-12 lg:col-span-4 flex flex-col">
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar conversaciones..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="p-2 space-y-2">
                    <Label className="text-xs">Estado</Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {Object.entries(statusConfig).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="p-2 space-y-2">
                    <Label className="text-xs">Red social</Label>
                    <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="p-2 space-y-2">
                    <Label className="text-xs">Sentimiento</Label>
                    <Select value={selectedSentiment} onValueChange={setSelectedSentiment}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {Object.entries(sentimentConfig).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Tabs defaultValue="todos" className="mt-2">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="todos" className="text-xs">Todos</TabsTrigger>
                <TabsTrigger value="nuevos" className="text-xs">Nuevos</TabsTrigger>
                <TabsTrigger value="leads" className="text-xs">Leads</TabsTrigger>
                <TabsTrigger value="urgentes" className="text-xs">Urgentes</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="divide-y">
                {filteredConversations.map((conv) => {
                  const NetworkIcon = networkIcons[conv.network]
                  const SentimentIcon = sentimentConfig[conv.sentiment].icon
                  const lastMessage = conv.messages[conv.messages.length - 1]
                  const isSelected = selectedConversation?.id === conv.id
                  
                  return (
                    <div 
                      key={conv.id}
                      className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${isSelected ? 'bg-muted' : ''}`}
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarFallback>{conv.userName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-background">
                            <NetworkIcon className="h-3 w-3" style={{ color: networkColors[conv.network] }} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm truncate">{conv.userName}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{lastMessage.content}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <SentimentIcon className={`h-3 w-3 ${sentimentConfig[conv.sentiment].color}`} />
                            <Badge variant="outline" className={`text-[10px] px-1 py-0 ${statusConfig[conv.status].color}`}>
                              {statusConfig[conv.status].label}
                            </Badge>
                            {conv.isLead && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 bg-emerald-100 text-emerald-700">
                                Lead
                              </Badge>
                            )}
                            {conv.status === "nuevo" && (
                              <div className="w-2 h-2 rounded-full bg-blue-500 ml-auto" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Conversation Thread */}
        <Card className="col-span-12 lg:col-span-5 flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader className="pb-2 flex-shrink-0 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{selectedConversation.userName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{selectedConversation.userName}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        {(() => {
                          const Icon = networkIcons[selectedConversation.network]
                          return <Icon className="h-3 w-3" style={{ color: networkColors[selectedConversation.network] }} />
                        })()}
                        {selectedConversation.userHandle}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Asignar a...
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Tag className="h-4 w-4 mr-2" />
                        Agregar etiqueta
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Escalar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Archive className="h-4 w-4 mr-2" />
                        Cerrar conversación
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {selectedConversation.postContent && (
                  <div className="mt-2 p-2 rounded-lg bg-muted text-sm">
                    <span className="text-muted-foreground">En respuesta a: </span>
                    <span className="italic">{selectedConversation.postContent}</span>
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {selectedConversation.messages.map((msg) => (
                      <div 
                        key={msg.id}
                        className={`flex ${msg.isFromBrand ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${msg.isFromBrand ? 'order-1' : ''}`}>
                          <div className={`p-3 rounded-lg ${
                            msg.isFromBrand 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 px-1">
                            {new Date(msg.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>

              <div className="p-4 border-t flex-shrink-0">
                {showQuickReplies && (
                  <div className="mb-3 p-3 rounded-lg border bg-muted/50">
                    <Label className="text-xs text-muted-foreground mb-2 block">Respuestas rápidas</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {mockQuickReplies.map((qr) => (
                        <Button 
                          key={qr.id} 
                          variant="outline" 
                          size="sm"
                          className="justify-start text-xs h-auto py-2"
                          onClick={() => handleQuickReply(qr.content)}
                        >
                          {qr.title}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setShowQuickReplies(!showQuickReplies)}
                  >
                    <Zap className="h-4 w-4" />
                  </Button>
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    className="flex-1 min-h-[40px] max-h-[120px]"
                    rows={1}
                  />
                  <Button onClick={handleSendReply} disabled={!replyText.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Selecciona una conversación</p>
              </div>
            </div>
          )}
        </Card>

        {/* Contact Details */}
        <Card className="col-span-12 lg:col-span-3 flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-base">Información del contacto</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto space-y-4">
                {/* Contact Info */}
                <div className="text-center pb-4 border-b">
                  <Avatar className="h-16 w-16 mx-auto mb-2">
                    <AvatarFallback className="text-lg">{selectedConversation.userName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold">{selectedConversation.userName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedConversation.userHandle}</p>
                </div>

                {/* Sentiment */}
                <div>
                  <Label className="text-xs text-muted-foreground">Sentimiento</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const config = sentimentConfig[selectedConversation.sentiment]
                      const Icon = config.icon
                      return (
                        <>
                          <Icon className={`h-5 w-5 ${config.color}`} />
                          <span className={`font-medium ${config.color}`}>{config.label}</span>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <Label className="text-xs text-muted-foreground">Etiquetas</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedConversation.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className={tagConfig[tag].color}>
                        {tagConfig[tag].label}
                      </Badge>
                    ))}
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      + Agregar
                    </Button>
                  </div>
                </div>

                {/* Assigned To */}
                <div>
                  <Label className="text-xs text-muted-foreground">Asignado a</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedConversation.assignedToName ? (
                      <>
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">{selectedConversation.assignedToName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{selectedConversation.assignedToName}</span>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" className="text-xs">
                        <UserPlus className="h-3 w-3 mr-1" />
                        Asignar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <Label className="text-xs text-muted-foreground">Estado</Label>
                  <Select defaultValue={selectedConversation.status}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Quick Actions */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Acciones rápidas</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Marcar lead
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Escalar
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Respondido
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Archive className="h-3 w-3 mr-1" />
                      Cerrar
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* History */}
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                    <History className="h-3 w-3" />
                    Historial de interacciones
                  </Label>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Conversación iniciada</span>
                      <span className="ml-auto">{new Date(selectedConversation.createdAt).toLocaleDateString()}</span>
                    </div>
                    {selectedConversation.messages.filter(m => m.isFromBrand).length > 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>Respuesta enviada</span>
                        <span className="ml-auto">{selectedConversation.messages.filter(m => m.isFromBrand).length} veces</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Selecciona una conversación</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
