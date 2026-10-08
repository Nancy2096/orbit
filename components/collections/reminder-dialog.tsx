"use client"

import { useState } from "react"
import useSWR from "swr"
import { AlertTriangle, Mail, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toWhatsAppNumber } from "@/lib/collections/rules"
import {
  MAX_CC_RECIPIENTS,
  MAX_TO_RECIPIENTS,
  parseEmailList,
  validateEmailList,
} from "@/lib/invoice-email-rules"
import { fetcher, formatMoney, postJson, refreshCollections, type ActionTarget } from "@/components/collections/shared"

export type ReminderChannel = "email" | "whatsapp"

interface ReminderPreview {
  agencyName: string
  agencyEmail: string | null
  groups: { currency: string; subtotal: number; invoices: unknown[] }[]
  otherAgencies: { invoiceCount: number; agencyCount: number }
}

interface ReminderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: ActionTarget | null
  channel: ReminderChannel
}

export function ReminderDialog({ open, onOpenChange, target, channel }: ReminderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && target && <ReminderLoader target={target} initialChannel={channel} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function balanceText(target: ActionTarget) {
  return Object.entries(target.pendingByCurrency)
    .map(([code, amount]) => formatMoney(amount, code))
    .join(" y ")
}

// Carga la vista previa antes de montar el formulario para precargar el CC con agencies.email.
function ReminderLoader(props: { target: ActionTarget; initialChannel: ReminderChannel; onDone: () => void }) {
  const { data, error, isLoading } = useSWR<ReminderPreview>(
    `/api/collections/clients/${props.target.clientId}/reminder`,
    fetcher,
    { revalidateOnFocus: false },
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Spinner />
        Cargando facturas pendientes…
      </div>
    )
  }
  return <ReminderForm {...props} preview={data ?? null} previewError={error ? (error as Error).message : null} />
}

function ReminderForm({
  target,
  initialChannel,
  onDone,
  preview,
  previewError,
}: {
  target: ActionTarget
  initialChannel: ReminderChannel
  onDone: () => void
  preview: ReminderPreview | null
  previewError: string | null
}) {
  const greeting = target.contactName ? `Hola ${target.contactName}` : "Hola"
  const [channel, setChannel] = useState<ReminderChannel>(initialChannel)
  const [to, setTo] = useState(target.contactEmail ?? "")
  const [cc, setCc] = useState(preview?.agencyEmail ?? "")
  const [subject, setSubject] = useState(`Recordatorio de pago - ${target.clientName}`)
  const [message, setMessage] = useState(
    "Te escribimos para recordarte que tienes facturas con saldo pendiente. Te compartimos el detalle a continuación para que puedas programar el pago.",
  )
  const [phone, setPhone] = useState(target.contactPhone ?? "")
  const [waText, setWaText] = useState(
    `${greeting}, te saludamos de parte del equipo de finanzas. Te recordamos que ${target.clientName} tiene un saldo pendiente de ${balanceText(
      target,
    )}. ¿Nos podrías confirmar la fecha de pago? Gracias.`,
  )
  const [sending, setSending] = useState(false)

  const groups = preview?.groups ?? []
  const otherAgencies = preview?.otherAgencies

  const emailError =
    (previewError ? `No se pudo cargar el detalle: ${previewError}` : null) ||
    (preview && groups.length === 0 ? "El cliente no tiene facturas pendientes en su agencia" : null) ||
    validateEmailList(parseEmailList(to), { field: "Para", max: MAX_TO_RECIPIENTS, required: true }) ||
    validateEmailList(parseEmailList(cc), { field: "CC", max: MAX_CC_RECIPIENTS }) ||
    (!subject.trim() ? "Escribe un asunto" : null)

  const waNumber = toWhatsAppNumber(phone)
  const waError = !waText.trim() ? "Escribe el mensaje" : phone.trim() && !waNumber ? "El teléfono no es válido" : null

  async function sendEmail() {
    setSending(true)
    try {
      const result = await postJson(`/api/collections/clients/${target.clientId}/reminder`, { to, cc, subject, message })
      toast.success(result?.skipped ? "Correo omitido (envío de correos desactivado en este entorno)" : "Recordatorio enviado")
      if (result?.historyLogged === false) toast.warning("El correo se procesó, pero no se pudo guardar en el historial")
      await refreshCollections()
      onDone()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo enviar el correo")
      await refreshCollections()
    } finally {
      setSending(false)
    }
  }

  async function openWhatsApp() {
    const url = `https://wa.me/${waNumber ?? ""}?text=${encodeURIComponent(waText.trim())}`
    window.open(url, "_blank", "noopener,noreferrer")
    setSending(true)
    try {
      await postJson(`/api/collections/clients/${target.clientId}/whatsapp`, { phone, message: waText.trim() })
      toast.success("WhatsApp registrado en el historial")
      await refreshCollections()
      onDone()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar el WhatsApp")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Enviar recordatorio</DialogTitle>
        <DialogDescription>
          {target.clientName} · Saldo pendiente {balanceText(target)}
        </DialogDescription>
      </DialogHeader>

      <Tabs value={channel} onValueChange={(v) => setChannel(v as ReminderChannel)}>
        <TabsList className="w-full">
          <TabsTrigger value="email" className="flex-1">
            <Mail data-icon="inline-start" />
            Correo
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex-1">
            <MessageCircle data-icon="inline-start" />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-4 flex flex-col gap-4">
          {groups.length > 1 && (
            <Alert>
              <AlertTriangle />
              <AlertDescription>
                Este cliente tiene saldo en varias monedas. El correo mostrará una tabla y un subtotal por cada una (
                {groups.map((g) => formatMoney(g.subtotal, g.currency)).join(" y ")}), sin sumarlas.
              </AlertDescription>
            </Alert>
          )}
          {otherAgencies && otherAgencies.invoiceCount > 0 && (
            <Alert>
              <AlertTriangle />
              <AlertDescription>
                Hay {otherAgencies.invoiceCount} factura{otherAgencies.invoiceCount === 1 ? "" : "s"} pendiente
                {otherAgencies.invoiceCount === 1 ? "" : "s"} de este cliente en{" "}
                {otherAgencies.agencyCount === 1 ? "otra agencia" : `${otherAgencies.agencyCount} agencias más`}. No se
                incluyen en este correo; solo se envían las de {preview?.agencyName}.
              </AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="reminder-to">Para</Label>
            <Input id="reminder-to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="cliente@empresa.com" />
            <p className="text-xs text-muted-foreground">Separa varios correos con comas (máx. {MAX_TO_RECIPIENTS}).</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reminder-cc">CC (opcional)</Label>
            <Input id="reminder-cc" value={cc} onChange={(e) => setCc(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              {preview?.agencyEmail
                ? "Se precarga el correo de la agencia; puedes borrarlo o agregar otros "
                : "Separa varios correos con comas "}
              (máx. {MAX_CC_RECIPIENTS}).
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reminder-subject">Asunto</Label>
            <Input id="reminder-subject" value={subject} maxLength={200} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reminder-message">Mensaje</Label>
            <Textarea id="reminder-message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              El correo incluye automáticamente la tabla de facturas pendientes con su vencimiento y saldo.
            </p>
          </div>
          <DialogFooter className="items-center gap-2">
            {emailError && (
              <p className="text-xs text-muted-foreground sm:mr-auto" role="status">
                {emailError}
              </p>
            )}
            <Button onClick={sendEmail} disabled={!!emailError || sending}>
              {sending && <Spinner />}
              Enviar correo
            </Button>
          </DialogFooter>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="reminder-phone">Teléfono</Label>
            <Input
              id="reminder-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10 dígitos o con lada internacional"
            />
            <p className="text-xs text-muted-foreground">
              Si lo dejas vacío, WhatsApp te pedirá elegir el contacto. Los números de 10 dígitos se toman como México (+52).
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reminder-wa">Mensaje</Label>
            <Textarea id="reminder-wa" rows={5} value={waText} onChange={(e) => setWaText(e.target.value)} />
          </div>
          <DialogFooter className="items-center gap-2">
            {waError && (
              <p className="text-xs text-muted-foreground sm:mr-auto" role="status">
                {waError}
              </p>
            )}
            <Button onClick={openWhatsApp} disabled={!!waError || sending}>
              {sending && <Spinner />}
              Abrir WhatsApp y registrar
            </Button>
          </DialogFooter>
        </TabsContent>
      </Tabs>
    </div>
  )
}
