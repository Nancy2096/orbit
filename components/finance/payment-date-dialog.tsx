"use client"

import { useEffect, useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { isFutureInMexicoCity, isValidDateOnly, todayInMexicoCity } from "@/lib/date-mx"

export function getPaymentDateError(value: string): string | null {
  if (!isValidDateOnly(value)) return "Selecciona la fecha de pago."
  if (isFutureInMexicoCity(value)) return "La fecha de pago no puede ser futura."
  return null
}

interface PaymentDateFieldProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

export function PaymentDateField({ value, onChange, label = "Fecha de pago" }: PaymentDateFieldProps) {
  const id = useId()
  const error = value ? getPaymentDateError(value) : null
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="date"
        value={value}
        max={todayInMexicoCity()}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Fecha real en que salió el pago (hora de Ciudad de México).</p>
      )}
    </div>
  )
}

interface PaymentDateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  initialDate?: string | null
  saving?: boolean
  onConfirm: (date: string) => void
}

export function PaymentDateDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  initialDate,
  saving,
  onConfirm,
}: PaymentDateDialogProps) {
  const [date, setDate] = useState("")

  useEffect(() => {
    if (open) setDate(initialDate?.slice(0, 10) || todayInMexicoCity())
  }, [open, initialDate])

  const error = getPaymentDateError(date)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <PaymentDateField value={date} onChange={setDate} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirm(date)} disabled={saving || !!error}>
            {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
