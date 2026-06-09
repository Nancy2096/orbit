"use client"

import { useMemo } from "react"
import { Share2, Users, Heart, FileText, Tag } from "lucide-react"
import {
  BrandSummaryDashboard,
  type SummaryRow,
} from "@/components/orbit-marketing-intelligence/brand-summary-dashboard"
import { mockBrands } from "@/lib/marketing-intelligence/brand-mock-data"
import { mockMIClients } from "@/lib/marketing-intelligence/mock-data"
import { mockSocialAccounts, mockSocialPosts } from "@/lib/marketing-intelligence/mock-data-phase2"

function formatCompact(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString("es-MX")
}

export default function SocialPage() {
  const getClientName = (clientId: string) =>
    mockMIClients.find((c) => c.id === clientId)?.name || "Cliente"

  const rows: SummaryRow[] = useMemo(() => {
    return mockBrands.map((brand) => {
      const accounts = mockSocialAccounts.filter((a) => a.brandId === brand.id)
      const posts = mockSocialPosts.filter((p) => p.brandId === brand.id)
      const followers = accounts.reduce((sum, a) => sum + a.followers, 0)
      const avgEngagement =
        accounts.length > 0
          ? accounts.reduce((sum, a) => sum + a.engagementRate, 0) / accounts.length
          : 0
      const published = posts.filter((p) => p.status === "publicado").length

      return {
        brandId: brand.id,
        brandName: brand.name,
        clientId: brand.clientId,
        clientName: getClientName(brand.clientId),
        cells: {
          accounts: accounts.length,
          followers: followers > 0 ? formatCompact(followers) : "—",
          engagement: accounts.length > 0 ? `${avgEngagement.toFixed(1)}%` : "—",
          posts: published,
        },
      }
    })
  }, [])

  const totals = useMemo(() => {
    const accounts = mockSocialAccounts
    return {
      brands: new Set(accounts.map((a) => a.brandId)).size,
      followers: accounts.reduce((sum, a) => sum + a.followers, 0),
      avgEngagement:
        accounts.length > 0
          ? accounts.reduce((sum, a) => sum + a.engagementRate, 0) / accounts.length
          : 0,
      published: mockSocialPosts.filter((p) => p.status === "publicado").length,
    }
  }, [])

  return (
    <BrandSummaryDashboard
      title="Redes Orgánicas"
      description="Resumen de desempeño orgánico por marca o proyecto. Gestiona el contenido dentro de cada marca."
      icon={Share2}
      detailLabel="Ver redes"
      detailHref={(id) => `/orbit-marketing-intelligence/brands/${id}/social`}
      kpis={[
        { label: "Marcas con redes", value: String(totals.brands), icon: Tag },
        { label: "Seguidores totales", value: formatCompact(totals.followers), icon: Users },
        { label: "Engagement promedio", value: `${totals.avgEngagement.toFixed(1)}%`, icon: Heart },
        { label: "Publicaciones", value: String(totals.published), icon: FileText },
      ]}
      columns={[
        { key: "accounts", label: "Cuentas", align: "right" },
        { key: "followers", label: "Seguidores", align: "right" },
        { key: "engagement", label: "Engagement", align: "right" },
        { key: "posts", label: "Publicados", align: "right" },
      ]}
      rows={rows}
    />
  )
}
