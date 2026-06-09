"use client"

import { ReactNode } from "react"
import { AgencyProvider, useAgency } from "@/contexts/agency-context"
import { Building2, AlertCircle } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

function AgencySelector() {
  const { agencies, selectedAgencyId, setSelectedAgencyId, loading } = useAgency()

  if (loading) {
    return (
      <div className="border-b bg-muted/30">
        <div className="px-6 py-3 flex items-center gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-[250px]" />
        </div>
      </div>
    )
  }

  if (agencies.length === 0) {
    return (
      <div className="border-b bg-muted/30 px-6 py-3">
        <Alert variant="destructive" className="mb-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No hay agencias configuradas. Configura una agencia primero.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="border-b bg-muted/30">
      <div className="px-6 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span>Agencia:</span>
        </div>
        <Select 
          value={selectedAgencyId || ""} 
          onValueChange={(value) => setSelectedAgencyId(value || null)}
        >
          <SelectTrigger className="w-[250px] bg-background">
            <SelectValue placeholder="Selecciona una agencia" />
          </SelectTrigger>
          <SelectContent>
            {agencies.map((agency) => (
              <SelectItem key={agency.id} value={agency.id}>
                {agency.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!selectedAgencyId && (
          <span className="text-sm text-amber-600 dark:text-amber-400">
            Selecciona una agencia para ver los datos
          </span>
        )}
      </div>
    </div>
  )
}

function CRMLayoutContent({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <AgencySelector />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}

export default function CRMLayout({ children }: { children: ReactNode }) {
  return (
    <AgencyProvider>
      <CRMLayoutContent>
        {children}
      </CRMLayoutContent>
    </AgencyProvider>
  )
}
