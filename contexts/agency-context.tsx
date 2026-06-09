"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

interface Agency {
  id: string
  name: string
}

interface AgencyContextType {
  agencies: Agency[]
  selectedAgencyId: string | null
  setSelectedAgencyId: (id: string | null) => void
  loading: boolean
  selectedAgency: Agency | null
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined)

const STORAGE_KEY = "crm_selected_agency"

export function AgencyProvider({ children }: { children: ReactNode }) {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [selectedAgencyId, setSelectedAgencyIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchAgencies = async () => {
      const { data } = await supabase
        .from("agencies")
        .select("id, name")
        .eq("is_active", true)
        .order("name")

      if (data && data.length > 0) {
        setAgencies(data)
        
        // Recuperar agencia guardada del localStorage
        const savedAgency = localStorage.getItem(STORAGE_KEY)
        if (savedAgency && data.some(a => a.id === savedAgency)) {
          setSelectedAgencyIdState(savedAgency)
        } else {
          // Si no hay agencia guardada, seleccionar la primera automáticamente
          setSelectedAgencyIdState(data[0].id)
          localStorage.setItem(STORAGE_KEY, data[0].id)
        }
      }
      setLoading(false)
    }

    fetchAgencies()
  }, [])

  const setSelectedAgencyId = (id: string | null) => {
    setSelectedAgencyIdState(id)
    if (id) {
      localStorage.setItem(STORAGE_KEY, id)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const selectedAgency = agencies.find(a => a.id === selectedAgencyId) || null

  return (
    <AgencyContext.Provider value={{ 
      agencies, 
      selectedAgencyId, 
      setSelectedAgencyId, 
      loading,
      selectedAgency 
    }}>
      {children}
    </AgencyContext.Provider>
  )
}

export function useAgency() {
  const context = useContext(AgencyContext)
  if (context === undefined) {
    throw new Error("useAgency must be used within an AgencyProvider")
  }
  return context
}
