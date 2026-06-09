"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { mockMIClients, mockMIBrands } from "@/lib/marketing-intelligence/mock-data"

export type PeriodType = "7d" | "14d" | "30d" | "90d" | "mtd" | "qtd" | "ytd" | "custom"

export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

export interface OMIFiltersContextType {
  // Client/Brand filters
  selectedClient: string
  setSelectedClient: (client: string) => void
  selectedBrand: string
  setSelectedBrand: (brand: string) => void
  
  // Period filters
  selectedPeriod: PeriodType
  setSelectedPeriod: (period: PeriodType) => void
  customDateRange: DateRange
  setCustomDateRange: (range: DateRange) => void
  
  // Computed values
  filteredBrands: typeof mockMIBrands
  getClientName: (clientId: string) => string
  getBrandName: (brandId: string) => string
  getPeriodLabel: () => string
  getDateRangeForPeriod: () => { from: Date; to: Date }
  
  // Helper to check if data matches filters
  matchesFilters: (clientId?: string, brandId?: string) => boolean
}

const OMIFiltersContext = createContext<OMIFiltersContextType | undefined>(undefined)

export function OMIFiltersProvider({ children }: { children: ReactNode }) {
  const [selectedClient, setSelectedClientState] = useState<string>("all")
  const [selectedBrand, setSelectedBrandState] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriodState] = useState<PeriodType>("30d")
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  })

  const setSelectedClient = useCallback((client: string) => {
    setSelectedClientState(client)
    setSelectedBrandState("all") // Reset brand when client changes
  }, [])

  const setSelectedBrand = useCallback((brand: string) => {
    setSelectedBrandState(brand)
  }, [])

  const setSelectedPeriod = useCallback((period: PeriodType) => {
    setSelectedPeriodState(period)
  }, [])

  const filteredBrands = selectedClient === "all"
    ? mockMIBrands
    : mockMIBrands.filter(b => b.clientId === selectedClient)

  const getClientName = useCallback((clientId: string) => {
    if (clientId === "all") return "Todos los clientes"
    const client = mockMIClients.find(c => c.id === clientId)
    return client?.name || "Cliente desconocido"
  }, [])

  const getBrandName = useCallback((brandId: string) => {
    if (brandId === "all") return "Todas las marcas"
    const brand = mockMIBrands.find(b => b.id === brandId)
    return brand?.name || "Marca desconocida"
  }, [])

  const getPeriodLabel = useCallback(() => {
    const labels: Record<PeriodType, string> = {
      "7d": "Últimos 7 días",
      "14d": "Últimos 14 días",
      "30d": "Últimos 30 días",
      "90d": "Últimos 90 días",
      "mtd": "Mes actual",
      "qtd": "Trimestre actual",
      "ytd": "Año actual",
      "custom": customDateRange.from && customDateRange.to 
        ? `${customDateRange.from.toLocaleDateString()} - ${customDateRange.to.toLocaleDateString()}`
        : "Personalizado",
    }
    return labels[selectedPeriod]
  }, [selectedPeriod, customDateRange])

  const getDateRangeForPeriod = useCallback(() => {
    const now = new Date()
    const to = new Date(now)
    let from = new Date(now)

    switch (selectedPeriod) {
      case "7d":
        from.setDate(from.getDate() - 7)
        break
      case "14d":
        from.setDate(from.getDate() - 14)
        break
      case "30d":
        from.setDate(from.getDate() - 30)
        break
      case "90d":
        from.setDate(from.getDate() - 90)
        break
      case "mtd":
        from = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "qtd":
        const quarter = Math.floor(now.getMonth() / 3)
        from = new Date(now.getFullYear(), quarter * 3, 1)
        break
      case "ytd":
        from = new Date(now.getFullYear(), 0, 1)
        break
      case "custom":
        if (customDateRange.from && customDateRange.to) {
          return { from: customDateRange.from, to: customDateRange.to }
        }
        from.setDate(from.getDate() - 30) // Default fallback
        break
    }

    return { from, to }
  }, [selectedPeriod, customDateRange])

  const matchesFilters = useCallback((clientId?: string, brandId?: string) => {
    // If "all" is selected, everything matches
    if (selectedClient === "all" && selectedBrand === "all") return true
    
    // Check client filter
    if (selectedClient !== "all" && clientId !== selectedClient) return false
    
    // Check brand filter
    if (selectedBrand !== "all" && brandId !== selectedBrand) return false
    
    return true
  }, [selectedClient, selectedBrand])

  return (
    <OMIFiltersContext.Provider
      value={{
        selectedClient,
        setSelectedClient,
        selectedBrand,
        setSelectedBrand,
        selectedPeriod,
        setSelectedPeriod,
        customDateRange,
        setCustomDateRange,
        filteredBrands,
        getClientName,
        getBrandName,
        getPeriodLabel,
        getDateRangeForPeriod,
        matchesFilters,
      }}
    >
      {children}
    </OMIFiltersContext.Provider>
  )
}

export function useOMIFilters() {
  const context = useContext(OMIFiltersContext)
  if (context === undefined) {
    throw new Error("useOMIFilters must be used within an OMIFiltersProvider")
  }
  return context
}
