"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  MoreHorizontal, 
  Calendar,
  User,
  Image,
  Video,
  Layers,
  FileText,
  GripVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react"
import { Instagram, Facebook, Smartphone, Linkedin, Youtube } from "lucide-react"
import { ContentPiece, ContentStatus, contentStatusConfig } from "@/lib/marketing-intelligence/brand-phase2-types"

// Platform icons
const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-3 w-3 text-pink-500" />,
  facebook: <Facebook className="h-3 w-3 text-blue-600" />,
  tiktok: <Smartphone className="h-3 w-3" />,
  linkedin: <Linkedin className="h-3 w-3 text-blue-700" />,
  youtube: <Youtube className="h-3 w-3 text-red-600" />,
  twitter: <span className="h-3 w-3 font-bold text-xs">X</span>,
}

// Format icons
const formatIcons: Record<string, React.ReactNode> = {
  imagen: <Image className="h-3 w-3" />,
  video: <Video className="h-3 w-3" />,
  reel: <Video className="h-3 w-3" />,
  story: <Layers className="h-3 w-3" />,
  carrusel: <Layers className="h-3 w-3" />,
  article: <FileText className="h-3 w-3" />,
  thread: <FileText className="h-3 w-3" />,
}

interface ContentKanbanCardProps {
  piece: ContentPiece
  onMove?: (id: string, newStatus: ContentStatus) => void
  onEdit?: (piece: ContentPiece) => void
  pillarName?: string
  pillarColor?: string
}

export function ContentKanbanCard({ 
  piece, 
  onMove, 
  onEdit,
  pillarName,
  pillarColor 
}: ContentKanbanCardProps) {
  const statusConfig = contentStatusConfig[piece.status]
  
  const getApprovalStatus = () => {
    if (piece.clientApproval?.status === 'rejected' || piece.internalApproval?.status === 'rejected') {
      return { icon: <AlertCircle className="h-3 w-3 text-red-500" />, text: 'Rechazado' }
    }
    if (piece.clientApproval?.status === 'approved' && piece.internalApproval?.status === 'approved') {
      return { icon: <CheckCircle2 className="h-3 w-3 text-green-500" />, text: 'Aprobado' }
    }
    if (piece.clientApproval?.status === 'pending' || piece.internalApproval?.status === 'pending') {
      return { icon: <Clock className="h-3 w-3 text-amber-500" />, text: 'Pendiente' }
    }
    return null
  }

  const approval = getApprovalStatus()

  return (
    <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                {platformIcons[piece.platform]}
                {formatIcons[piece.format]}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(piece)}>Editar</DropdownMenuItem>
                  <DropdownMenuItem>Ver detalle</DropdownMenuItem>
                  <DropdownMenuItem>Duplicar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Title */}
            <p className="text-sm font-medium line-clamp-2 mb-2">{piece.title}</p>

            {/* Pillar */}
            {pillarName && (
              <Badge 
                variant="outline" 
                className="text-xs mb-2"
                style={{ borderColor: pillarColor, color: pillarColor }}
              >
                {pillarName}
              </Badge>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                {piece.scheduledDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(piece.scheduledDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
              {approval && (
                <span className="flex items-center gap-1">
                  {approval.icon}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ContentKanbanColumnProps {
  status: ContentStatus
  pieces: ContentPiece[]
  pillars?: { id: string; name: string; color: string }[]
  onMove?: (id: string, newStatus: ContentStatus) => void
  onEdit?: (piece: ContentPiece) => void
}

export function ContentKanbanColumn({ 
  status, 
  pieces, 
  pillars = [],
  onMove,
  onEdit
}: ContentKanbanColumnProps) {
  const config = contentStatusConfig[status]
  
  const getPillarInfo = (pillarId?: string) => {
    if (!pillarId) return undefined
    const pillar = pillars.find(p => p.id === pillarId)
    return pillar ? { name: pillar.name, color: pillar.color } : undefined
  }

  return (
    <div className="flex-shrink-0 w-72">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div 
          className="w-2 h-2 rounded-full" 
          style={{ backgroundColor: config.color }}
        />
        <h3 className="font-medium text-sm">{config.label}</h3>
        <Badge variant="secondary" className="ml-auto text-xs">
          {pieces.length}
        </Badge>
      </div>
      <div className="space-y-2 min-h-[200px]">
        {pieces.map(piece => {
          const pillarInfo = getPillarInfo(piece.pillarId)
          return (
            <ContentKanbanCard
              key={piece.id}
              piece={piece}
              onMove={onMove}
              onEdit={onEdit}
              pillarName={pillarInfo?.name}
              pillarColor={pillarInfo?.color}
            />
          )
        })}
        {pieces.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
            Sin contenido
          </div>
        )}
      </div>
    </div>
  )
}

interface ContentKanbanProps {
  pieces: ContentPiece[]
  pillars?: { id: string; name: string; color: string }[]
  visibleStatuses?: ContentStatus[]
  onMove?: (id: string, newStatus: ContentStatus) => void
  onEdit?: (piece: ContentPiece) => void
}

export function ContentKanban({ 
  pieces, 
  pillars = [],
  visibleStatuses,
  onMove,
  onEdit
}: ContentKanbanProps) {
  const statuses: ContentStatus[] = visibleStatuses || [
    'idea', 'draft', 'writing', 'design', 
    'internal_review', 'client_review', 
    'approved', 'scheduled', 'published'
  ]

  const groupedPieces = statuses.reduce((acc, status) => {
    acc[status] = pieces.filter(p => p.status === status)
    return acc
  }, {} as Record<ContentStatus, ContentPiece[]>)

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statuses.map(status => (
        <ContentKanbanColumn
          key={status}
          status={status}
          pieces={groupedPieces[status] || []}
          pillars={pillars}
          onMove={onMove}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}

// Content Status Badge Component
interface ContentStatusBadgeProps {
  status: ContentStatus
  size?: 'sm' | 'md'
}

export function ContentStatusBadge({ status, size = 'sm' }: ContentStatusBadgeProps) {
  const config = contentStatusConfig[status]
  
  return (
    <Badge 
      variant="outline"
      className={`${size === 'sm' ? 'text-xs' : 'text-sm'} ${config.bgColor}`}
      style={{ borderColor: config.color, color: config.color }}
    >
      {config.label}
    </Badge>
  )
}
