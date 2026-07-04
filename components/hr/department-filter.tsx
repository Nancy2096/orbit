"use client"

import { useMemo } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface DepartmentOption {
  id: string
  name: string
  agency_id: string | null
}

interface DepartmentFilterProps {
  departments: DepartmentOption[]
  /** Agencia seleccionada actualmente ("all" o un id de agencia) */
  agencyId: string
  /** Valor seleccionado ("all" o el nombre del departamento) */
  value: string
  onChange: (value: string) => void
  className?: string
}

/**
 * Combo de Departamento para las secciones de RRHH.
 *
 * Los departamentos son iguales en todas las agencias, por lo que cuando se
 * seleccionan "Todas las agencias" se deduplican por nombre y solo se muestra
 * una opción de cada departamento. Al elegir una agencia concreta se muestran
 * únicamente los departamentos de esa agencia.
 */
export function DepartmentFilter({
  departments,
  agencyId,
  value,
  onChange,
  className,
}: DepartmentFilterProps) {
  const names = useMemo(() => {
    const scoped =
      agencyId === "all"
        ? departments
        : departments.filter((d) => d.agency_id === agencyId)
    return Array.from(new Set(scoped.map((d) => d.name).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b),
    )
  }, [departments, agencyId])

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? "w-full sm:w-[200px]"}>
        <SelectValue placeholder="Departamento" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos los departamentos</SelectItem>
        {names.map((name) => (
          <SelectItem key={name} value={name}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
