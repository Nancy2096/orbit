"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { MAX_NOTE_LENGTH } from "@/lib/collections/rules"
import { postJson, refreshCollections, type ActionTarget } from "@/components/collections/shared"

interface BaseProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: ActionTarget | null
}

export function CallNoteDialog({ open, onOpenChange, target }: BaseProps) {
  return (
    <NoteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Registrar nota de llamada"
      description={target ? `Resultado de la llamada con ${target.clientName}.` : ""}
      label="Nota"
      placeholder="Ej. Habló con contabilidad, pagarán el viernes."
      submitLabel="Guardar nota"
      required
      onSubmit={async (note) => {
        if (!target) return
        await postJson(`/api/collections/clients/${target.clientId}/activities`, { type: "call", note })
        toast.success("Llamada registrada")
      }}
    />
  )
}

export function PauseDialog({ open, onOpenChange, target }: BaseProps) {
  const resuming = target?.servicePaused === true
  return (
    <NoteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={resuming ? "Reactivar servicio" : "Solicitar pausa operativa de cuenta"}
      description={
        target
          ? resuming
            ? `Se quitará la marca de pausa de ${target.clientName} y se registrará en el historial.`
            : `Se marcará a ${target.clientName} con pausa de servicio y se registrará en el historial. No se modifican cuentas, proyectos ni tareas en Operaciones.`
          : ""
      }
      label={resuming ? "Nota (opcional)" : "Motivo"}
      placeholder={resuming ? "Ej. Liquidó el saldo vencido." : "Ej. Más de 60 días vencido sin compromiso de pago."}
      submitLabel={resuming ? "Reactivar servicio" : "Marcar pausa"}
      destructive={!resuming}
      required={!resuming}
      onSubmit={async (reason) => {
        if (!target) return
        await postJson(`/api/collections/clients/${target.clientId}/pause`, { paused: !resuming, reason })
        toast.success(resuming ? "Servicio reactivado" : "Pausa de servicio registrada")
      }}
    />
  )
}

function NoteDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  placeholder,
  submitLabel,
  required = false,
  destructive = false,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  label: string
  placeholder: string
  submitLabel: string
  required?: boolean
  destructive?: boolean
  onSubmit: (note: string) => Promise<void>
}) {
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const trimmed = note.trim()
  const disabledReason = required && !trimmed ? `Escribe ${label.toLowerCase()} para continuar` : null

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (disabledReason) return
    setSaving(true)
    try {
      await onSubmit(trimmed)
      setNote("")
      await refreshCollections()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo completar la acción")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setNote("")
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="collections-note">{label}</Label>
            <Textarea
              id="collections-note"
              rows={4}
              maxLength={MAX_NOTE_LENGTH}
              placeholder={placeholder}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter className="items-center gap-2">
            {disabledReason && (
              <p className="text-xs text-muted-foreground sm:mr-auto" role="status">
                {disabledReason}
              </p>
            )}
            <Button type="submit" variant={destructive ? "destructive" : "default"} disabled={!!disabledReason || saving}>
              {saving && <Spinner />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
