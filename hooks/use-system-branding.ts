"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export interface SystemBranding {
  system_name: string
  tagline: string
  logo_url: string | null
  logo_name_url: string | null
  favicon_url: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  text_color: string
  background_color: string
  sidebar_color: string
  font_family: string
}

const defaultBranding: SystemBranding = {
  system_name: "AgencyHub",
  tagline: "Sistema de Gestión Multiagencia",
  logo_url: null,
  logo_name_url: null,
  favicon_url: null,
  primary_color: "#3B82F6",
  secondary_color: "#10B981",
  accent_color: "#F59E0B",
  text_color: "#1F2937",
  background_color: "#FFFFFF",
  sidebar_color: "#1F2937",
  font_family: "Inter",
}

export function useSystemBranding() {
  const [branding, setBranding] = useState<SystemBranding>(defaultBranding)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBranding = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "branding")
        .single()

      if (data?.value) {
        const loadedBranding = { ...defaultBranding, ...data.value }
        setBranding(loadedBranding)
        applyColorsToCSS(loadedBranding)
      }
      setLoading(false)
    }

    fetchBranding()
  }, [])

  // Función para convertir hex a oklch
  const hexToOklch = (hex: string): string => {
    // Convertir hex a RGB normalizado (0-1)
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    
    // Convertir RGB a linear RGB
    const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    const lr = toLinear(r)
    const lg = toLinear(g)
    const lb = toLinear(b)
    
    // Convertir a XYZ
    const x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb
    const y = 0.2126729 * lr + 0.7151522 * lg + 0.0721750 * lb
    const z = 0.0193339 * lr + 0.1191920 * lg + 0.9503041 * lb
    
    // Convertir XYZ a OKLab
    const l_ = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z)
    const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z)
    const s_ = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z)
    
    const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
    const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
    const bOklab = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    
    // Convertir OKLab a OKLCH
    const C = Math.sqrt(a * a + bOklab * bOklab)
    let H = Math.atan2(bOklab, a) * 180 / Math.PI
    if (H < 0) H += 360
    
    return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`
  }

  // Aplicar los colores como variables CSS
  const applyColorsToCSS = (brandingData: SystemBranding) => {
    if (typeof document === 'undefined') return
    
    const root = document.documentElement
    
    // Aplicar color primario
    if (brandingData.primary_color) {
      const primaryOklch = hexToOklch(brandingData.primary_color)
      root.style.setProperty('--primary', primaryOklch)
      root.style.setProperty('--ring', primaryOklch)
      root.style.setProperty('--chart-1', primaryOklch)
    }
    
    // Aplicar color secundario
    if (brandingData.secondary_color) {
      const secondaryOklch = hexToOklch(brandingData.secondary_color)
      root.style.setProperty('--accent', secondaryOklch)
      root.style.setProperty('--success', secondaryOklch)
      root.style.setProperty('--chart-2', secondaryOklch)
    }
    
    // Aplicar color de acento
    if (brandingData.accent_color) {
      const accentOklch = hexToOklch(brandingData.accent_color)
      root.style.setProperty('--warning', accentOklch)
      root.style.setProperty('--chart-3', accentOklch)
    }
    
    // Aplicar color del sidebar
    if (brandingData.sidebar_color) {
      const sidebarOklch = hexToOklch(brandingData.sidebar_color)
      root.style.setProperty('--sidebar', sidebarOklch)
    }
    
    // Aplicar color de fondo
    if (brandingData.background_color) {
      const bgOklch = hexToOklch(brandingData.background_color)
      root.style.setProperty('--background', bgOklch)
      root.style.setProperty('--card', bgOklch)
      root.style.setProperty('--popover', bgOklch)
    }
    
    // Aplicar color de texto
    if (brandingData.text_color) {
      const textOklch = hexToOklch(brandingData.text_color)
      root.style.setProperty('--foreground', textOklch)
      root.style.setProperty('--card-foreground', textOklch)
      root.style.setProperty('--popover-foreground', textOklch)
    }
    
    }

  const getLogoUrl = (logoUrl: string | null) => {
    if (!logoUrl) return null
    
    // Si es una URL completa de Vercel Blob, usarla directamente
    if (logoUrl.includes('.vercel-storage.com') || logoUrl.includes('.public.blob.vercel-storage.com')) {
      return logoUrl
    }
    
    // Si es un pathname relativo, usar la API de archivo
    if (logoUrl.startsWith('system/') || logoUrl.startsWith('logos/') || !logoUrl.startsWith('http')) {
      return `/api/file?pathname=${encodeURIComponent(logoUrl)}`
    }
    
    return logoUrl
  }

  return { branding, loading, getLogoUrl }
}
