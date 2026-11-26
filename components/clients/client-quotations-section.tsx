"use client"

import { useState } from "react"
import useSWR from "swr"
import { upload } from "@vercel/blob/client"
import { Download, Eye, FileText, Trash2, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import {
  QUOTATION_ACCEPT,
  QUOTATION_MAX_SIZE_MB,
  safeBlobFileName,
  validateQuotationFile,
} from "@/lib/quotation-files"

export interface QuotationItem {
  id: string
  source: "client" | "prospect" | "account"
  file_name: string
  href: string
  file_size: number | null
  uploaded_at: string | null
  uploaded_by_name: string | null
}

export interface QuotationGroup {
  key: string
  source: "client" | "prospect" | "account"
  label: string
  readOnly: boolean
  items: QuotationItem[]
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("No se pudieron cargar las cotizaciones")
  return res.json() as Promise<{ groups: QuotationGroup[] }>
}

export function useClientQuotations(clientId: string) {
  const { data, error, isLoading, mutate } = useSWR(`/api/clients/${clientId}/quotations`, fetcher)
  const groups = data?.groups ?? []
  const total = groups.reduce((sum, g) => sum + g.items.length, 0)
  return { groups, total, error, isLoading, mutate }
}

function formatSize(bytes: number | null) {
  if (!bytes) return null
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value: string | null) {
  if (!value) return null
  return new Date(value).toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

function downloadHref(item: QuotationItem) {
  const sep = item.href.includes("?") ? "&" : "?"
  return `${item.href}${sep}download=1&filename=${encodeURIComponent(item.file_name)}`
}

export function ClientQuotationsSection({
  clientId,
  quotations,
}: {
  clientId: string
  quotations: ReturnType<typeof useClientQuotations>
}) {
  const { groups, total, isLoading, error, mutate } = quotations
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ""
    if (files.length === 0) return

    const invalid = files
      .map((f) => ({ f, err: validateQuotationFile(f) }))
      .filter((x) => x.err)
    if (invalid.length > 0) {
      setMessage(invalid.map((x) => `${x.f.name}: ${x.err}`).join(" "))
      return
    }

    setMessage(null)
    setUploading(true)
    const failures: string[] = []
    for (const file of files) {
      try {
        const blob = await upload(
          `client-quotations/${clientId}/${Date.now()}-${safeBlobFileName(file.name)}`,
          file,
          { access: "private", handleUploadUrl: `/api/clients/${clientId}/quotations` },
        )
        const res = await fetch(`/api/clients/${clientId}/quotations`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: blob.url, filename: file.name }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || "No se pudo guardar")
        }
      } catch (err) {
        failures.push(`${file.name}: ${err instanceof Error ? err.message : "No se pudo subir"}`)
      }
    }
    setUploading(false)
    if (failures.length > 0) setMessage(failures.join(" "))
    mutate()
  }

  async function handleDelete(item: QuotationItem) {
    if (!confirm(`¿Eliminar la cotización "${item.file_name}"? Esta acción no se puede deshacer.`)) return
    setDeletingId(item.id)
    try {
      const res = await fetch(
        `/api/clients/${clientId}/quotations?quotationId=${encodeURIComponent(item.id)}`,
        { method: "DELETE" },
      )
      if (!res.ok) throw new Error("No se pudo eliminar la cotización")
      mutate()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo eliminar la cotización")
    } finally {
      setDeletingId(null)
    }
  }

  const clientGroup = groups.find((g) => g.source === "client")
  const otherGroups = groups.filter((g) => g.source !== "client")

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Cotización
              <Badge variant={total > 0 ? "default" : "secondary"}>{total > 0 ? "Sí" : "No"}</Badge>
            </CardTitle>
            <CardDescription>
              {`Sube uno o varios documentos (PDF, Word, Excel o imagen, máx. ${QUOTATION_MAX_SIZE_MB} MB cada uno).`}
            </CardDescription>
          </div>
          <Button type="button" variant="outline" disabled={uploading} asChild>
            <label className="cursor-pointer">
              {uploading ? (
                <>
                  <Spinner className="mr-2" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Cargar cotización
                </>
              )}
              <input
                type="file"
                multiple
                accept={QUOTATION_ACCEPT}
                className="sr-only"
                onChange={handleFiles}
                disabled={uploading}
              />
            </label>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {message && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {message}
          </p>
        )}

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">No se pudieron cargar las cotizaciones.</p>
        ) : (
          <>
            <QuotationGroupList
              label="Del cliente"
              items={clientGroup?.items ?? []}
              emptyText="Aún no se ha cargado ninguna cotización para este cliente."
              onDelete={handleDelete}
              deletingId={deletingId}
            />
            {otherGroups.map((group) => (
              <QuotationGroupList key={group.key} label={group.label} items={group.items} readOnly />
            ))}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function QuotationGroupList({
  label,
  items,
  emptyText,
  readOnly,
  onDelete,
  deletingId,
}: {
  label: string
  items: QuotationItem[]
  emptyText?: string
  readOnly?: boolean
  onDelete?: (item: QuotationItem) => void
  deletingId?: string | null
}) {
  return (
    <section className="flex flex-col gap-2" aria-label={label}>
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">{label}</h3>
        <span className="text-xs text-muted-foreground">({items.length})</span>
        {readOnly && (
          <Badge variant="outline" className="text-xs font-normal">
            Solo consulta
          </Badge>
        )}
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const meta = [
              item.uploaded_by_name ? `Subido por ${item.uploaded_by_name}` : null,
              formatDate(item.uploaded_at),
              formatSize(item.file_size),
            ].filter(Boolean)
            return (
              <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.file_name}</p>
                    {meta.length > 0 && <p className="text-xs text-muted-foreground">{meta.join(" · ")}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="icon" asChild title="Ver">
                    <a href={item.href} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">{`Ver ${item.file_name}`}</span>
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" asChild title="Descargar">
                    <a href={downloadHref(item)} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                      <span className="sr-only">{`Descargar ${item.file_name}`}</span>
                    </a>
                  </Button>
                  {!readOnly && onDelete && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Eliminar"
                      onClick={() => onDelete(item)}
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? <Spinner /> : <Trash2 className="h-4 w-4 text-destructive" />}
                      <span className="sr-only">{`Eliminar ${item.file_name}`}</span>
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
