"use client"

import { useMemo } from "react"
import { Calendar as CalendarIcon, Send, Clock, FileText, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  BrandSummaryDashboard,
  type SummaryRow,
} from "@/components/orbit-marketing-intelligence/brand-summary-dashboard"
import { mockBrands } from "@/lib/marketing-intelligence/brand-mock-data"
import { mockMIClients } from "@/lib/marketing-intelligence/mock-data"
import { mockSocialPosts } from "@/lib/marketing-intelligence/mock-data-phase2"

const pendingStatuses = ["idea", "en_redaccion", "en_diseno", "en_revision", "aprobado"]

export default function CalendarioPage() {
  const getClientName = (clientId: string) =>
    mockMIClients.find((c) => c.id === clientId)?.name || "Cliente"

  const rows: SummaryRow[] = useMemo(() => {
    return mockBrands.map((brand) => {
      const posts = mockSocialPosts.filter((p) => p.brandId === brand.id)
      const scheduled = posts.filter((p) => p.status === "programado").length
      const published = posts.filter((p) => p.status === "publicado").length
      const pending = posts.filter((p) => pendingStatuses.includes(p.status)).length

      return {
        brandId: brand.id,
        brandName: brand.name,
        clientId: brand.clientId,
        clientName: getClientName(brand.clientId),
        cells: {
          total: posts.length,
          scheduled:
            scheduled > 0 ? (
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                {scheduled}
              </Badge>
            ) : (
              <span className="text-muted-foreground">0</span>
            ),
          pending: pending,
          published: published,
        },
      }
    })
  }, [])

  const totals = useMemo(() => {
    const posts = mockSocialPosts
    return {
      brands: new Set(posts.map((p) => p.brandId)).size,
      scheduled: posts.filter((p) => p.status === "programado").length,
      pending: posts.filter((p) => pendingStatuses.includes(p.status)).length,
      published: posts.filter((p) => p.status === "publicado").length,
    }
  }, [])

  return (
    <BrandSummaryDashboard
      title="Calendario"
      description="Resumen del calendario editorial por marca o proyecto. Programa y aprueba contenido dentro de cada marca."
      icon={CalendarIcon}
      detailLabel="Ver calendario"
      detailHref={(id) => `/orbit-marketing-intelligence/brands/${id}/calendar`}
      kpis={[
        { label: "Marcas con contenido", value: String(totals.brands), icon: Tag },
        { label: "Programados", value: String(totals.scheduled), icon: Clock },
        { label: "En proceso", value: String(totals.pending), icon: FileText },
        { label: "Publicados", value: String(totals.published), icon: Send },
      ]}
      columns={[
        { key: "total", label: "Total piezas", align: "right" },
        { key: "scheduled", label: "Programados", align: "right" },
        { key: "pending", label: "En proceso", align: "right" },
        { key: "published", label: "Publicados", align: "right" },
      ]}
      rows={rows}
    />
  )
}
