export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Building2, ExternalLink, Mail, Phone, MapPin, Globe, Edit, Eye, MoreHorizontal } from "lucide-react"
import type { Agency } from "@/lib/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AgencyWithBranding extends Agency {
  logo_url?: string | null
  settings?: {
    branding?: {
      primary_color?: string
      secondary_color?: string
      tagline?: string
    }
  } | null
}

// Helper para obtener la URL correcta del logo
function getLogoUrl(logoUrl: string | null | undefined): string | null {
  if (!logoUrl) return null
  if (logoUrl.includes('.vercel-storage.com/')) {
    const pathname = logoUrl.split('.vercel-storage.com/')[1]
    return `/api/file?pathname=${encodeURIComponent(pathname)}`
  }
  if (logoUrl.startsWith('logos/') || logoUrl.startsWith('staff-photos/')) {
    return `/api/file?pathname=${encodeURIComponent(logoUrl)}`
  }
  return logoUrl
}

async function getAgencies(): Promise<AgencyWithBranding[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("agencies")
    .select("*")
    .order("created_at", { ascending: false })
  
  if (error) console.log("[v0] Error:", error)
  
  return data || []
}

export default async function AgenciesPage() {
  const agencies = await getAgencies()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agencias</h1>
          <p className="text-muted-foreground">
            Gestiona las agencias del grupo empresarial
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/agencies/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Agencia
          </Link>
        </Button>
      </div>

      {agencies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No hay agencias registradas</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comienza creando tu primera agencia para organizar tu grupo empresarial
            </p>
            <Button asChild>
              <Link href="/dashboard/agencies/new">
                <Plus className="mr-2 h-4 w-4" />
                Crear Primera Agencia
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agencies.map((agency) => {
            const primaryColor = agency.settings?.branding?.primary_color || "#3b82f6"
            const secondaryColor = agency.settings?.branding?.secondary_color || "#64748b"
            
            return (
              <Card 
                key={agency.id} 
                className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300"
              >
                {/* Header con gradiente */}
                <div 
                  className="h-24 relative"
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 50%, ${primaryColor}99 100%)`
                  }}
                >
                  {/* Patron decorativo */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/2" />
                  </div>
                  
                  {/* Menu de acciones */}
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/agencies/${agency.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/agencies/${agency.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/agencies/${agency.id}/catalogs`}>
                            <Building2 className="mr-2 h-4 w-4" />
                            Catalogos
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Badge de estado */}
                  <div className="absolute top-3 left-3">
                    <Badge 
                      variant="secondary" 
                      className={agency.is_active 
                        ? "bg-green-500/90 text-white border-0 shadow-sm" 
                        : "bg-gray-500/90 text-white border-0 shadow-sm"
                      }
                    >
                      {agency.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                </div>

                {/* Avatar/Logo - posicionado entre header y contenido */}
                <div className="relative px-5">
                  <div className="absolute -top-10 left-5">
                    {agency.logo_url ? (
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white shadow-lg ring-4 ring-white">
                        <img
                          src={getLogoUrl(agency.logo_url) || ""}
                          alt={agency.name}
                          className="w-full h-full object-contain bg-white p-2"
                        />
                      </div>
                    ) : (
                      <div 
                        className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {agency.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contenido */}
                <CardContent className="pt-14 pb-5 px-5">
                  <div className="space-y-4">
                    {/* Nombre y tagline */}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground leading-tight">
                        {agency.name}
                      </h3>
                      {agency.settings?.branding?.tagline && (
                        <p className="text-sm mt-1 italic" style={{ color: secondaryColor }}>
                          {agency.settings.branding.tagline}
                        </p>
                      )}
                      {!agency.settings?.branding?.tagline && agency.legal_name && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {agency.legal_name}
                        </p>
                      )}
                    </div>

                    {/* Info de contacto */}
                    <div className="space-y-2">
                      {agency.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted">
                            <Mail className="h-3.5 w-3.5" />
                          </div>
                          <span className="truncate">{agency.email}</span>
                        </div>
                      )}
                      {agency.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted">
                            <Phone className="h-3.5 w-3.5" />
                          </div>
                          <span>{agency.phone}</span>
                        </div>
                      )}
                      {agency.website && (
                        <a
                          href={agency.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted">
                            <Globe className="h-3.5 w-3.5" />
                          </div>
                          <span className="truncate">{agency.website.replace(/^https?:\/\//, "")}</span>
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </a>
                      )}
                    </div>

                    {/* Boton principal */}
                    <Link 
                      href={`/dashboard/agencies/${agency.id}`}
                      className="block w-full"
                    >
                      <Button 
                        variant="outline" 
                        className="w-full mt-2 group-hover:border-primary group-hover:text-primary transition-colors"
                      >
                        Ver Agencia
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
