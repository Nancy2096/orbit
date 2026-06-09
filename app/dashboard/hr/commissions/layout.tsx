"use client"

import { AgencyProvider, useAgency } from "@/contexts/agency-context"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Building2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

function AgencySelector() {
  const { agencies, selectedAgencyId, setSelectedAgencyId, loading } = useAgency()

  if (loading) {
    return <Skeleton className="h-10 w-[250px]" />
  }

  return (
    <div className="flex items-center gap-2 mb-6 p-4 bg-muted/50 rounded-lg border">
      <Building2 className="h-5 w-5 text-muted-foreground" />
      <span className="text-sm font-medium text-muted-foreground">Agencia:</span>
      <Select value={selectedAgencyId || ""} onValueChange={setSelectedAgencyId}>
        <SelectTrigger className="w-[250px] bg-background">
          <SelectValue placeholder="Seleccionar agencia" />
        </SelectTrigger>
        <SelectContent>
          {agencies.map((agency) => (
            <SelectItem key={agency.id} value={agency.id}>
              {agency.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function CommissionsLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6">
      <AgencySelector />
      {children}
    </div>
  )
}

export default function CommissionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AgencyProvider>
      <CommissionsLayoutContent>{children}</CommissionsLayoutContent>
    </AgencyProvider>
  )
}
