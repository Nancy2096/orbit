"use client"

import { useEffect, useRef, useState } from "react"

/**
 * useState que persiste su valor en localStorage bajo `key`.
 *
 * Lee el valor guardado de forma SINCRONA en el inicializador de useState,
 * de modo que el valor correcto esta disponible desde el primer render del
 * cliente. Esto evita la condicion de carrera en la que un efecto de guardado
 * escribia el valor por defecto sobre el valor almacenado al remontar la
 * pagina (al navegar entre ventanas).
 *
 * Nota: las paginas que lo usan renderizan su contenido real solo despues de
 * montar (gate `mounted`), por lo que leer localStorage en el inicializador no
 * provoca mismatch de hidratacion.
 */
export function usePersistentState<T>(
  key: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue
    try {
      const stored = window.localStorage.getItem(key)
      if (stored !== null) return JSON.parse(stored) as T
    } catch {
      // Ignorar JSON invalido o acceso denegado a localStorage.
    }
    return defaultValue
  })

  // Evitar escribir en localStorage durante el primer render/commit; solo
  // guardamos cuando el valor cambia realmente despues del montaje.
  const isFirst = useRef(true)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignorar cuota excedida o acceso denegado.
    }
  }, [key, value])

  return [value, setValue]
}
