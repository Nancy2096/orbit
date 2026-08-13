"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.log("[v0] Dashboard render error:", error?.message)
    console.log("[v0] Dashboard error stack:", error?.stack)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Ocurrió un error al cargar esta sección</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Se produjo un problema al mostrar el contenido. Puedes intentar recargar la sección.
        </p>
      </div>

      {error?.message && (
        <pre className="max-w-xl overflow-auto rounded-md border bg-muted/50 p-3 text-left text-xs text-muted-foreground">
          {error.message}
        </pre>
      )}

      <Button onClick={reset} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Reintentar
      </Button>
    </div>
  )
}
