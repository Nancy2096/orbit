"use client"

import { useMemo } from "react"
import { Plug, CheckCircle2, AlertTriangle, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  BrandSummaryDashboard,
  type SummaryRow,
} from "@/components/orbit-marketing-intelligence/brand-summary-dashboard"
import { mockBrands } from "@/lib/marketing-intelligence/brand-mock-data"
import { mockMIClients, mockMIConnectors } from "@/lib/marketing-intelligence/mock-data"

export default function ConnectorsPage() {
  const getClientName = (clientId: string) =>
    mockMIClients.find((c) => c.id === clientId)?.name || "Cliente"

  const rows: SummaryRow[] = useMemo(() => {
    return mockBrands.map((brand) => {
      const connectors = mockMIConnectors.filter((c) => c.brandId === brand.id)
      const connected = connectors.filter((c) => c.status === "connected").length
      const issues = connectors.filter(
        (c) => c.status === "error" || c.status === "token_expired"
      ).length

      return {
        brandId: brand.id,
        brandName: brand.name,
        clientId: brand.clientId,
        clientName: getClientName(brand.clientId),
        cells: {
          total: connectors.length,
          connected: (
            <span className="inline-flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {connected}
            </span>
          ),
          issues:
            issues > 0 ? (
              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {issues}
              </Badge>
            ) : (
              <span className="text-muted-foreground">0</span>
            ),
        },
      }
    })
  }, [])

  const totals = useMemo(() => {
    const all = mockMIConnectors
    return {
      brandsWithConnectors: new Set(all.map((c) => c.brandId).filter(Boolean)).size,
      total: all.length,
      connected: all.filter((c) => c.status === "connected").length,
      issues: all.filter((c) => c.status === "error" || c.status === "token_expired").length,
    }
  }, [])

  return (
    <BrandSummaryDashboard
      title="Conectores"
      description="Resumen de integraciones de datos por marca o proyecto. Configura los conectores dentro de cada marca."
      icon={Plug}
      detailLabel="Configurar"
      detailHref={(id) => `/orbit-marketing-intelligence/brands/${id}/integrations`}
      kpis={[
        { label: "Marcas con conectores", value: String(totals.brandsWithConnectors), icon: Tag },
        { label: "Conexiones totales", value: String(totals.total), icon: Plug },
        { label: "Activas", value: String(totals.connected), icon: CheckCircle2 },
        { label: "Con problemas", value: String(totals.issues), icon: AlertTriangle },
      ]}
      columns={[
        { key: "total", label: "Conectores", align: "right" },
        { key: "connected", label: "Activos", align: "right" },
        { key: "issues", label: "Problemas", align: "right" },
      ]}
      rows={rows}
    />
  )
}
