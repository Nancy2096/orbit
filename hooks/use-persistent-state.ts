"use client"

import { useEffect, useRef, useState } from "react"

/**
 * useState que persiste su valor en localStorage bajo `key`.
 *
 * - En el primer render devuelve `defaultValue` para evitar mismatch de
 *   hidratacion (SSR/CSR). Tras montar, lee el valor guardado si existe.
 * - Cada cambio se guarda automaticamente en localStorage, de modo que el
 *   valor sobrevive a la navegacion entre paginas y recargas, hasta que el
 *   usuario lo cambie manualmente.
 */
export function usePersistentState<T>(
  key: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(defaultValue)
  const hydrated = useRef(false)

  // Cargar el valor guardado una sola vez, despues de montar.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored !== null) {
        setValue(JSON.parse(stored) as T)
      }
    } catch {
      // Ignorar JSON invalido o acceso denegado a localStorage.
    }
    hydrated.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Guardar en cada cambio, pero solo despues de haber hidratado, para no
  // sobrescribir el valor almacenado con el default en el primer render.
  useEffect(() => {
    if (!hydrated.current) return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignorar cuota excedida o acceso denegado.
    }
  }, [key, value])

  return [value, setValue]
}
