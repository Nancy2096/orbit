"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { MAX_NOTE_LENGTH, toLocalIsoDate } from "@/lib/collections/rules"
import { formatMoney, postJson, refreshCollections, type ActionTarget } from "@/components/collections/shared"

interface PromiseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: ActionTarget | null
  // Si no hay cliente preseleccionado, se muestra un selector con estas opciones.
  options?: ActionTarget[]
}

export function PromiseDialog({ open, onOpenChange, target, options = [] }: PromiseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <PromiseForm target={target} options={options} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

export function PromiseForm({
  target,
  options = [],
  onDone,
  embedded = false,
}: {
  target: ActionTarget | null
  options?: ActionTarget[]
  onDone?: () => void
  embedded?: boolean
}) {
  const [clientId, setClientId] = useState(target?.clientId ?? "")
  const selected = target ?? options.find((o) => o.clientId === clientId) ?? null
  const currencies = Object.keys(selected?.pendingByCurrency ?? {})
  const [currency, setCurrency] = useState(currencies[0] ?? "MXN")
  const [date, setDate] = useState("")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  const activeCurrency = currencies.includes(currency) ? currency : (currencies[0] ?? "MXN")
  const maxAmount = selected?.pendingByCurrency[activeCurrency] ?? 0
  const today = toLocalIsoDate(new Date())
  const numericAmount = Number(amount)

  let disabledReason: string | null = null
  if (!selected) disabledReason = "Selecciona un cliente"
  else if (!date) disabledReason = "Selecciona la fecha del compromiso"
  else if (date < today) disabledReason = "La fecha no puede ser anterior a hoy"
  else if (!amount || !(numericAmount > 0)) disabledReason = "Indica un monto mayor a cero"
  else if (numericAmount > maxAmount + 0.005) disabledReason = `El monto excede el saldo pendiente (${formatMoney(maxAmount, activeCurrency)})`
  else if (note.length > MAX_NOTE_LENGTH) disabledReason = `La nota excede ${MAX_NOTE_LENGTH} caracteres`

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!selected || disabledReason) return
    setSaving(true)
    try {
      await postJson(`/api/collections/clients/${selected.clientId}/promises`, {
        promisedDate: date,
        amount: numericAmount,
        currency: activeCurrency,
        note,
      })
      toast.success("Compromiso de pago registrado")
      setDate("")
      setAmount("")
      setNote("")
      await refreshCollections()
      onDone?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar el compromiso")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!embedded && (
        <DialogHeader>
          <DialogTitle>Registrar compromiso de pago</DialogTitle>
          <DialogDescription>
            {selected ? `Promesa de pago de ${selected.clientName}.` : "Selecciona el cliente que se comprometió a pagar."}
          </DialogDescription>
        </DialogHeader>
      )}

      {!target && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="promise-client">Cliente</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger id="promise-client" className="w-full">
              <SelectValue placeholder="Selecciona un cliente" />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.clientId} value={o.clientId}>
                  {o.clientName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="promise-date">Fecha prometida</Label>
          <Input id="promise-date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="promise-amount">Monto</Label>
          <div className="flex gap-2">
            <Input
              id="promise-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="min-w-0"
            />
            {currencies.length > 1 ? (
              <Select value={activeCurrency} onValueChange={setCurrency}>
                <SelectTrigger className="w-24" aria-label="Moneda">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="flex items-center text-sm text-muted-foreground">{activeCurrency}</span>
            )}
          </div>
        </div>
      </div>
      {selected && (
        <p className="-mt-2 text-xs text-muted-foreground">
          Saldo pendiente: {formatMoney(maxAmount, activeCurrency)}
          {maxAmount > 0 && (
            <button
              type="button"
              className="ml-2 font-medium text-primary underline-offset-2 hover:underline"
              onClick={() => setAmount(maxAmount.toFixed(2))}
            >
              Usar total
            </button>
          )}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="promise-note">Nota (opcional)</Label>
        <Textarea
          id="promise-note"
          rows={3}
          maxLength={MAX_NOTE_LENGTH}
          placeholder="Ej. Confirmó por llamada que paga por transferencia."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <DialogFooter className={embedded ? "sm:justify-start" : undefined}>
        <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          {disabledReason && (date || amount || !embedded) && (
            <p className="text-xs text-muted-foreground sm:mr-auto" role="status">
              {disabledReason}
            </p>
          )}
          <Button type="submit" disabled={!!disabledReason || saving}>
            {saving && <Spinner />}
            Guardar compromiso
          </Button>
        </div>
      </DialogFooter>
    </form>
  )
}
