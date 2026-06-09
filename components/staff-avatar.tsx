"use client"

import { useMemo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface StaffAvatarProps {
  photoUrl: string | null | undefined
  firstName: string
  lastName: string
  className?: string
  fallbackClassName?: string
}

export function StaffAvatar({ 
  photoUrl, 
  firstName, 
  lastName, 
  className,
  fallbackClassName 
}: StaffAvatarProps) {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?'
  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Usuario'

  // Generar la URL de imagen a través de nuestro endpoint proxy
  const imageUrl = useMemo(() => {
    if (!photoUrl) return null
    
    // Si es una URL de Vercel Blob privado, usar nuestro endpoint proxy
    if (photoUrl.includes('.private.blob.vercel-storage.com')) {
      return `/api/blob/image?url=${encodeURIComponent(photoUrl)}`
    }
    
    // Si es una URL de Vercel Blob público o cualquier otra, usar directamente
    return photoUrl
  }, [photoUrl])
  
  return (
    <Avatar className={cn("h-10 w-10", className)}>
      {imageUrl && (
        <AvatarImage 
          src={imageUrl} 
          alt={fullName}
        />
      )}
      <AvatarFallback className={fallbackClassName}>
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
