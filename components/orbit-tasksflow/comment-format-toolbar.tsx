"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ImageIcon,
  Paperclip,
  Bold,
  Italic,
  Strikethrough,
  Type,
  Highlighter,
  Link as LinkIcon,
  Quote,
  Code,
  List,
  ListOrdered,
  Table as TableIcon,
  AlignLeft,
  Mic,
} from "lucide-react"

interface CommentFormatToolbarProps {
  value: string
  onValueChange: (value: string) => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onImage?: () => void
  onAttach?: () => void
}

const HIGHLIGHT_COLORS = [
  { label: "Amarillo", token: "==" },
  { label: "Verde", token: "^^" },
  { label: "Azul", token: "++" },
]

const TEXT_STYLES = [
  { label: "Texto normal", prefix: "" },
  { label: "Título", prefix: "# " },
  { label: "Subtítulo", prefix: "## " },
]

export function CommentFormatToolbar({
  value,
  onValueChange,
  textareaRef,
  onImage,
  onAttach,
}: CommentFormatToolbarProps) {
  const [recording, setRecording] = useState(false)

  const getSelection = () => {
    const ta = textareaRef.current
    const start = ta?.selectionStart ?? value.length
    const end = ta?.selectionEnd ?? value.length
    return { ta, start, end }
  }

  const restoreCaret = (pos: number) => {
    requestAnimationFrame(() => {
      const ta = textareaRef.current
      if (!ta) return
      ta.focus()
      ta.setSelectionRange(pos, pos)
    })
  }

  // Envuelve la selección con marcadores (negrita, cursiva, código, resaltado...)
  const wrapSelection = (before: string, after = before) => {
    const { start, end } = getSelection()
    const selected = value.slice(start, end)
    const next = value.slice(0, start) + before + selected + after + value.slice(end)
    onValueChange(next)
    restoreCaret(start + before.length + selected.length + after.length)
  }

  // Agrega un prefijo al inicio de la línea actual (listas, cita, títulos)
  const prefixLine = (prefix: string) => {
    const { start } = getSelection()
    const lineStart = value.lastIndexOf("\n", start - 1) + 1
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart)
    onValueChange(next)
    restoreCaret(start + prefix.length)
  }

  const insertAtCaret = (text: string) => {
    const { start, end } = getSelection()
    const next = value.slice(0, start) + text + value.slice(end)
    onValueChange(next)
    restoreCaret(start + text.length)
  }

  const handleImage = () => {
    if (onImage) return onImage()
    wrapSelection("![", "](url)")
  }

  const handleAttach = () => {
    if (onAttach) return onAttach()
    wrapSelection("[", "](url)")
  }

  const handleMic = () => {
    // Dictado por voz cuando el navegador lo soporta; si no, no hace nada.
    const SpeechRecognition =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    if (!SpeechRecognition) {
      setRecording((r) => !r)
      return
    }
    try {
      const recognition = new SpeechRecognition()
      recognition.lang = "es-ES"
      recognition.interimResults = false
      recognition.onstart = () => setRecording(true)
      recognition.onend = () => setRecording(false)
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join(" ")
        insertAtCaret((value.endsWith(" ") || value.length === 0 ? "" : " ") + transcript)
      }
      if (recording) {
        recognition.stop()
      } else {
        recognition.start()
      }
    } catch {
      setRecording(false)
    }
  }

  const IconButton = ({
    label,
    onClick,
    active,
    children,
  }: {
    label: string
    onClick: () => void
    active?: boolean
    children: React.ReactNode
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-7 w-7 ${active ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
          onClick={onClick}
          aria-label={label}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )

  const Sep = () => <Separator orientation="vertical" className="mx-0.5 h-5" />

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-wrap items-center gap-0.5 rounded-t-md border border-b-0 bg-muted/40 px-1.5 py-1">
        <IconButton label="Insertar imagen" onClick={handleImage}>
          <ImageIcon className="h-4 w-4" />
        </IconButton>
        <IconButton label="Adjuntar archivo" onClick={handleAttach}>
          <Paperclip className="h-4 w-4" />
        </IconButton>

        <Sep />

        <IconButton label="Negrita" onClick={() => wrapSelection("**")}>
          <Bold className="h-4 w-4" />
        </IconButton>
        <IconButton label="Cursiva" onClick={() => wrapSelection("_")}>
          <Italic className="h-4 w-4" />
        </IconButton>
        <IconButton label="Tachado" onClick={() => wrapSelection("~~")}>
          <Strikethrough className="h-4 w-4" />
        </IconButton>

        {/* Estilo de texto (Tt) */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  aria-label="Estilo de texto"
                >
                  <Type className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Estilo de texto</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Estilo de texto</DropdownMenuLabel>
            {TEXT_STYLES.map((style) => (
              <DropdownMenuItem
                key={style.label}
                onSelect={() => (style.prefix ? prefixLine(style.prefix) : textareaRef.current?.focus())}
              >
                {style.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Color de resaltado */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  aria-label="Color de resaltado"
                >
                  <Highlighter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Resaltar</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Resaltar</DropdownMenuLabel>
            {HIGHLIGHT_COLORS.map((color) => (
              <DropdownMenuItem key={color.label} onSelect={() => wrapSelection(color.token)}>
                {color.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Sep />

        <IconButton label="Enlace" onClick={() => wrapSelection("[", "](url)")}>
          <LinkIcon className="h-4 w-4" />
        </IconButton>
        <IconButton label="Cita" onClick={() => prefixLine("> ")}>
          <Quote className="h-4 w-4" />
        </IconButton>
        <IconButton label="Código" onClick={() => wrapSelection("`")}>
          <Code className="h-4 w-4" />
        </IconButton>
        <IconButton label="Lista con viñetas" onClick={() => prefixLine("- ")}>
          <List className="h-4 w-4" />
        </IconButton>
        <IconButton label="Lista numerada" onClick={() => prefixLine("1. ")}>
          <ListOrdered className="h-4 w-4" />
        </IconButton>
        <IconButton
          label="Insertar tabla"
          onClick={() =>
            insertAtCaret("\n| Columna 1 | Columna 2 |\n| --- | --- |\n| Celda | Celda |\n")
          }
        >
          <TableIcon className="h-4 w-4" />
        </IconButton>
        <IconButton label="Alinear" onClick={() => prefixLine("")}>
          <AlignLeft className="h-4 w-4" />
        </IconButton>

        <Sep />

        <IconButton label="Dictado por voz" onClick={handleMic} active={recording}>
          <Mic className="h-4 w-4" />
        </IconButton>
      </div>
    </TooltipProvider>
  )
}
