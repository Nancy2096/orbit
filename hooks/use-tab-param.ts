"use client"

import { useCallback, useEffect, useState } from "react"

/**
 * Sincroniza el valor de una pestaña (Tabs) con el parámetro `?tab=` de la URL.
 *
 * - El valor inicial se lee de la URL (para permitir deep-links desde el buscador
 *   global). La lectura se hace en un efecto tras el montaje para evitar
 *   desajustes de hidratación en recargas de página.
 * - Al cambiar de pestaña se actualiza la URL con `history.replaceState`, sin
 *   provocar navegación, recarga de datos del servidor ni saltos de scroll.
 *
 * Uso (reemplaza a useState para el estado de pestaña):
 *   const [tab, setTab] = useTabParam("courses")
 *   <Tabs value={tab} onValueChange={setTab}>
 */
export function useTabParam(defaultValue: string, key = "tab") {
  const [tab, setTabState] = useState<string>(defaultValue)

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get(key)
    if (value) setTabState(value)
  }, [key])

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
