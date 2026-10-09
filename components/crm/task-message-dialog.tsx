"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { AlertTriangle, Mail, MessageCircle, Send } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  MAX_MESSAGE_LENGTH,
  MAX_SUBJECT_LENGTH,
  buildWhatsAppWebUrl,
  fillTemplate,
  hasPendingPlaceholders,
  needsSignature,
  toWhatsAppNumber,
} from "@/lib/crm/prospect-messages"
import { MAX_CC_RECIPIENTS, MAX_TO_RECIPIENTS, parseEmailList, validateEmailList } from "@/lib/invoice-email-rules"

export type MessageChannel = "email" | "whatsapp"

export interface MessageTask {
  id: string
  title: string
  whatsapp_message?: string | null
  email_subject?: string | null
  email_message?: string | null
}

export interface ContactOption {
  label: string
  value: string
}

interface TaskMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  channel: MessageChannel
  prospectId: string
  prospectName: string
  task: MessageTask | null
  emailOptions: ContactOption[]
  phoneOptions: ContactOption[]
  onLogged: () => void
  onTaskCompleted?: (taskId: string) => void
}

interface SenderInfo {
  senderName: string
  senderEmail: string | null
  fromName: string
  canSendEmail: boolean
}

const fetcher = async (url: string): Promise<SenderInfo> => {
  const res = await fetch(url)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || "No se pudo cargar la información del remitente")
  return data
}

export function TaskMessageDialog(props: TaskMessageDialogProps) {
  const { open, onOpenChange, channel, prospectId, task } = props
  const { data, error, isLoading } = useSWR(open ? `/api/crm/prospects/${prospectId}/messages` : null, fetcher, {
    revalidateOnFocus: false,
  })

  const isEmail = channel === "email"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEmail ? <Mail className="h-5 w-5 text-blue-600" /> : <MessageCircle className="h-5 w-5 text-emerald-600" />}
            {isEmail ? "Enviar correo" : "Enviar WhatsApp"}
          </DialogTitle>
          <DialogDescription>
            {task?.title ? `Tarea: ${task.title}. ` : ""}
            Revisa y personaliza el mensaje antes de enviarlo.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner className="h-5 w-5" />
          </div>
        ) : error ? (
          <p className="py-6 text-sm text-destructive">{error.message}</p>
        ) : task ? (
          <MessageForm
            key={`${task.id}-${channel}`}
            {...props}
            task={task}
            senderName={data?.senderName ?? ""}
            senderEmail={data?.senderEmail ?? null}
            fromName={data?.fromName ?? ""}
            canSendEmail={data?.canSendEmail ?? false}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function MessageForm({
  channel,
  prospectId,
  prospectName,
  task,
  emailOptions,
  phoneOptions,
  onOpenChange,
  onLogged,
  onTaskCompleted,
  senderName,
  senderEmail,
  fromName,
  canSendEmail,
}: TaskMessageDialogProps & {
  task: MessageTask
  senderName: string
  senderEmail: string | null
  fromName: string
  canSendEmail: boolean
}) {
  const values = { prospectName, senderName }
  const isEmail = channel === "email"

  const [to, setTo] = useState(emailOptions[0]?.value ?? "")
  const [cc, setCc] = useState("")
  const [subject, setSubject] = useState(fillTemplate(task.email_subject, values))
  const [phone, setPhone] = useState(phoneOptions[0]?.value ?? "")
  const [message, setMessage] = useState(fillTemplate(isEmail ? task.email_message : task.whatsapp_message, values))
  const [sending, setSending] = useState(false)
  const [completeTask, setCompleteTask] = useState(true)
  const emailBlocked = isEmail && !canSendEmail

  const pendingPlaceholders = hasPendingPlaceholders(`${isEmail ? subject : ""} ${message}`)

  const postMessage = (payload: Record<string, unknown>) =>
    fetch(`/api/crm/prospects/${prospectId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, taskId: task.id, taskTitle: task.title, message: message.trim() }),
    }).then(async (res) => ({ ok: res.ok, data: await res.json().catch(() => ({})) }))

  const handleWhatsApp = async () => {
    const waNumber = toWhatsAppNumber(phone)
    if (!waNumber) return toast.error("Captura un teléfono válido (10 dígitos o con lada internacional)")
    if (!message.trim()) return toast.error("Escribe el mensaje")

    // Se abre antes de cualquier await para que el navegador no bloquee la ventana.
    window.open(buildWhatsAppWebUrl(waNumber, message.trim()), "_blank", "noopener,noreferrer")

    setSending(true)
    const { ok, data } = await postMessage({ channel: "whatsapp", phone })
    setSending(false)
    if (!ok) return toast.error(data.error || "No se pudo registrar el WhatsApp")
    toast.success("WhatsApp Web abierto y registrado en actividades")
    onLogged()
    onOpenChange(false)
  }

  const handleEmail = async () => {
    const toList = parseEmailList(to)
    const ccList = parseEmailList(cc)
    const listError =
      validateEmailList(toList, { field: "Para", max: MAX_TO_RECIPIENTS, required: true }) ||
      validateEmailList(ccList, { field: "CC", max: MAX_CC_RECIPIENTS })
    if (listError) return toast.error(listError)
    if (!subject.trim()) return toast.error("Escribe el asunto")
    if (!message.trim()) return toast.error("Escribe el mensaje")

    setSending(true)
    const { ok, data } = await postMessage({
      channel: "email",
      to: toList,
      cc: ccList,
      subject: subject.trim(),
      completeTask,
    })
    setSending(false)
    if (!ok) {
      if (data.logged) onLogged()
      return toast.error(data.error || "No se pudo enviar el correo")
    }
    if (data.skipped) toast.warning("Los envíos de correo están desactivados; se registró como omitido")
    else if (data.redirected) toast.success("Correo enviado al correo de prueba y registrado en actividades")
    else toast.success("Correo enviado y registrado en actividades")
    if (data.taskCompleted) onTaskCompleted?.(task.id)
    onLogged()
    onOpenChange(false)
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (isEmail) handleEmail()
        else handleWhatsApp()
      }}
    >
      {emailBlocked && (
        <p role="alert" className="flex items-start gap-1.5 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Solo el responsable del prospecto o un usuario de Dirección General, Comercial o Superadmin puede enviar
          correos desde aquí.
        </p>
      )}
      {isEmail ? (
        <>
          {fromName && (
            <p className="text-xs text-muted-foreground">
              El prospecto verá como remitente: <span className="font-medium text-foreground">{fromName}</span>
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="msg-to">Para *</Label>
            {emailOptions.length > 1 && (
              <Select value={emailOptions.some((o) => o.value === to) ? to : undefined} onValueChange={setTo}>
                <SelectTrigger aria-label="Elegir contacto">
                  <SelectValue placeholder="Elegir contacto del prospecto" />
                </SelectTrigger>
                <SelectContent>
                  {emailOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Input
              id="msg-to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
            <p className="text-xs text-muted-foreground">
              Separa varios correos con coma (máximo {MAX_TO_RECIPIENTS}).
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="msg-cc">CC</Label>
            <Input id="msg-cc" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="msg-subject">Asunto *</Label>
            <Input
              id="msg-subject"
              value={subject}
              maxLength={MAX_SUBJECT_LENGTH}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
        </>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="msg-phone">Teléfono *</Label>
          {phoneOptions.length > 1 && (
            <Select value={phoneOptions.some((o) => o.value === phone) ? phone : undefined} onValueChange={setPhone}>
              <SelectTrigger aria-label="Elegir contacto">
                <SelectValue placeholder="Elegir contacto del prospecto" />
              </SelectTrigger>
              <SelectContent>
                {phoneOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Input
            id="msg-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10 dígitos o con lada, ej. 5512345678"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="msg-body">Mensaje *</Label>
        <Textarea
          id="msg-body"
          value={message}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-48"
        />
        {pendingPlaceholders && (
          <p className="flex items-start gap-1.5 text-xs text-amber-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            El mensaje aún tiene datos entre corchetes, por ejemplo [Nombre del Desarrollo]. Complétalos antes de enviar.
          </p>
        )}
        {isEmail ? (
          <div className="space-y-1 text-xs text-muted-foreground">
            {senderEmail && (
              <p>
                Las respuestas del prospecto llegarán a {senderEmail}, y recibirás una copia oculta del correo.
              </p>
            )}
            {needsSignature(message, senderName) && <p>Se agregará tu nombre ({senderName}) como firma al final.</p>}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Se abrirá WhatsApp Web con la sesión que tengas iniciada en este navegador. Allí solo da clic en enviar.
          </p>
        )}
      </div>

      {isEmail && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="msg-complete-task"
            checked={completeTask}
            onCheckedChange={(checked) => setCompleteTask(checked === true)}
          />
          <Label htmlFor="msg-complete-task" className="font-normal">
            Marcar la tarea como completada al enviar
          </Label>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={sending || emailBlocked}
          className={isEmail ? undefined : "bg-emerald-600 text-white hover:bg-emerald-700"}
        >
          {sending ? <Spinner className="mr-2 h-4 w-4" /> : isEmail ? <Send className="mr-2 h-4 w-4" /> : <MessageCircle className="mr-2 h-4 w-4" />}
          {isEmail ? "Enviar correo" : "Abrir WhatsApp Web"}
        </Button>
      </DialogFooter>
    </form>
  )
}
