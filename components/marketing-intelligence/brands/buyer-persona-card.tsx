"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ApprovalBadge } from "./quality-score-badge"
import type { BuyerPersona, ApprovalStatus } from "@/lib/marketing-intelligence/brand-types"
import { 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Trash2, 
  Sparkles, 
  User,
  MapPin,
  Briefcase,
  Heart,
  Target,
  MessageSquare,
  Hash
} from "lucide-react"

interface BuyerPersonaCardProps {
  persona: BuyerPersona
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onGenerateImage?: () => void
  onStatusChange?: (status: ApprovalStatus) => void
  className?: string
}

export function BuyerPersonaCard({
  persona,
  onEdit,
  onDuplicate,
  onDelete,
  onGenerateImage,
  onStatusChange,
  className
}: BuyerPersonaCardProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <Card className={cn("group relative transition-all hover:shadow-md", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                {persona.image ? (
                  <AvatarImage src={persona.image} alt={persona.name} />
                ) : (
                  <AvatarFallback className="text-lg bg-gradient-to-br from-primary/20 to-primary/10">
                    {getInitials(persona.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              {!persona.imageGenerated && (
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full shadow-sm"
                  onClick={onGenerateImage}
                  title="Generar imagen con IA"
                >
                  <Sparkles className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div>
              <CardTitle className="text-base">{persona.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 text-xs">
                <User className="h-3 w-3" />
                {persona.gender === 'femenino' ? 'Mujer' : persona.gender === 'masculino' ? 'Hombre' : 'Otro'}, {persona.age} años
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ApprovalBadge status={persona.status} showIcon={false} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onGenerateImage}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generar imagen
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {onStatusChange && (
                  <>
                    <DropdownMenuItem onClick={() => onStatusChange('en_revision')}>
                      Enviar a revisión
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange('aprobado')}>
                      Aprobar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{persona.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Briefcase className="h-3 w-3" />
            <span className="truncate">{persona.profession}</span>
          </div>
        </div>
        
        {/* NSE Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">NSE {persona.socioeconomicLevel}</Badge>
          <Badge variant="outline" className="text-xs">{persona.maritalStatus}</Badge>
        </div>
        
        {/* Motivations */}
        {persona.motivations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium flex items-center gap-1">
              <Heart className="h-3 w-3 text-red-500" />
              Motivaciones
            </p>
            <div className="flex flex-wrap gap-1">
              {persona.motivations.slice(0, 3).map((m, i) => (
                <Badge key={i} variant="secondary" className="text-xs font-normal">
                  {m}
                </Badge>
              ))}
              {persona.motivations.length > 3 && (
                <Badge variant="secondary" className="text-xs font-normal">
                  +{persona.motivations.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Pains */}
        {persona.pains.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium flex items-center gap-1">
              <Target className="h-3 w-3 text-amber-500" />
              Dolores
            </p>
            <div className="flex flex-wrap gap-1">
              {persona.pains.slice(0, 2).map((p, i) => (
                <Badge key={i} variant="outline" className="text-xs font-normal border-amber-200 bg-amber-50">
                  {p}
                </Badge>
              ))}
              {persona.pains.length > 2 && (
                <Badge variant="outline" className="text-xs font-normal border-amber-200">
                  +{persona.pains.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Channels */}
        {persona.socialNetworks.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium flex items-center gap-1">
              <MessageSquare className="h-3 w-3 text-blue-500" />
              Redes preferidas
            </p>
            <div className="flex flex-wrap gap-1">
              {persona.socialNetworks.map((sn, i) => (
                <Badge key={i} variant="outline" className="text-xs font-normal">
                  {sn}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Keywords preview */}
        {persona.keywords.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium flex items-center gap-1">
              <Hash className="h-3 w-3 text-green-500" />
              Keywords
            </p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {persona.keywords.slice(0, 3).join(', ')}
              {persona.keywords.length > 3 && '...'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Mini card for persona selection/preview
interface BuyerPersonaMiniProps {
  persona: BuyerPersona
  selected?: boolean
  onClick?: () => void
  className?: string
}

export function BuyerPersonaMini({ 
  persona, 
  selected = false, 
  onClick,
  className 
}: BuyerPersonaMiniProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border text-left transition-all w-full",
        selected 
          ? "border-primary bg-primary/5 shadow-sm" 
          : "border-border hover:border-primary/50 hover:bg-muted/50",
        className
      )}
    >
      <Avatar className="h-10 w-10">
        {persona.image ? (
          <AvatarImage src={persona.image} alt={persona.name} />
        ) : (
          <AvatarFallback className="text-sm">
            {persona.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm truncate">{persona.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {persona.age} años, {persona.profession}
        </p>
      </div>
      <ApprovalBadge status={persona.status} showIcon={false} className="shrink-0" />
    </button>
  )
}
