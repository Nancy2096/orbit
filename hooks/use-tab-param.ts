"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

/**
 * Sincroniza el valor de una pestaña (Tabs) con el parámetro `?tab=` de la URL.
 *
 * - Lee el valor desde la URL de forma reactiva con `useSearchParams`, de modo
 *   que funciona tanto al llegar por un deep-link (buscador global) como al
 *   cambiar de pestaña estando ya en la misma página.
 * - Al cambiar de pestaña actualiza la URL con `history.replaceState`, sin
 *   provocar navegación del servidor, recarga de datos ni saltos de scroll.
 *
 * Uso (reemplaza a useState para el estado de pestaña):
 *   const [tab, setTab] = useTabParam("courses")
 *   <Tabs value={tab} onValueChange={setTab}>
 */
export function useTabParam(defaultValue: string, key = "tab") {
  const searchParams = useSearchParams()
  const paramValue = searchParams.get(key)
  const [tab, setTabState] = useState<string>(defaultValue)

  // Sincroniza el estado cuando cambia el parámetro en la URL (deep-link o
  // navegación dentro de la misma página).
  useEffect(() => {
    if (paramValue) setTabState(paramValue)
  }, [paramValue])

  const setTab = useCallback(
    (value: string) => {
      setTabState(value)
      if (typeof window === "undefined") return
      const params = new URLSearchParams(window.location.search)
      params.set(key, value)
      const query = params.toString()
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`)
    },
    [key],
  )

  return [tab, setTab] as const
}
