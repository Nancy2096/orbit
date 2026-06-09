"use client"

import { useMemo } from "react"
import { Megaphone, DollarSign, Users, Target, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  BrandSummaryDashboard,
  type SummaryRow,
} from "@/components/orbit-marketing-intelligence/brand-summary-dashboard"
import { mockBrands } from "@/lib/marketing-intelligence/brand-mock-data"
import { mockMIClients, mockMICampaigns } from "@/lib/marketing-intelligence/mock-data"
import { formatCurrency } from "@/lib/marketing-intelligence/calculations"

export default function CampaignsPage() {
  const getClientName = (clientId: string) =>
    mockMIClients.find((c) => c.id === clientId)?.name || "Cliente"

  const rows: SummaryRow[] = useMemo(() => {
    return mockBrands.map((brand) => {
      const campaigns = mockMICampaigns.filter((c) => c.brandId === brand.id)
      const active = campaigns.filter((c) => c.status === "activo").length
      const spent = campaigns.reduce((sum, c) => sum + c.spent, 0)
      const leads = campaigns.reduce((sum, c) => sum + c.leads, 0)
      const avgRoas =
        campaigns.length > 0
          ? campaigns.reduce((sum, c) => sum + c.roas, 0) / campaigns.length
          : 0

      return {
        brandId: brand.id,
        brandName: brand.name,
        clientId: brand.clientId,
        clientName: getClientName(brand.clientId),
        cells: {
          active:
            active > 0 ? (
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                {active} activas
              </Badge>
            ) : (
              <span className="text-muted-foreground">Sin campañas</span>
            ),
          spent: formatCurrency(spent),
          leads: leads.toLocaleString("es-MX"),
          roas: campaigns.length > 0 ? `${avgRoas.toFixed(1)}x` : "—",
        },
      }
    })
  }, [])

  const totals = useMemo(() => {
    const all = mockMICampaigns
    return {
      brands: new Set(all.map((c) => c.brandId)).size,
      spent: all.reduce((sum, c) => sum + c.spent, 0),
      leads: all.reduce((sum, c) => sum + c.leads, 0),
      active: all.filter((c) => c.status === "activo").length,
    }
  }, [])

  return (
    <BrandSummaryDashboard
      title="Campañas Pagadas"
      description="Resumen de inversión publicitaria por marca o proyecto. Gestiona las campañas dentro de cada marca."
      icon={Megaphone}
      detailLabel="Ver campañas"
      detailHref={(id) => `/orbit-marketing-intelligence/brands/${id}/paid`}
      kpis={[
        { label: "Marcas con campañas", value: String(totals.brands), icon: Tag },
        { label: "Inversión total", value: formatCurrency(totals.spent), icon: DollarSign },
        { label: "Leads generados", value: totals.leads.toLocaleString("es-MX"), icon: Users },
        { label: "Campañas activas", value: String(totals.active), icon: Target },
      ]}
      columns={[
        { key: "active", label: "Estado", align: "left" },
        { key: "spent", label: "Invertido", align: "right" },
        { key: "leads", label: "Leads", align: "right" },
        { key: "roas", label: "ROAS prom.", align: "right" },
      ]}
      rows={rows}
    />
  )
}
