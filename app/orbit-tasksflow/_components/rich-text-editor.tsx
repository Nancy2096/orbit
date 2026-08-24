"use client"

import { useEffect, useRef, useState } from "react"
import {
  ImageIcon,
  Paperclip,
  Bold,
  Italic,
  Strikethrough,
  Type,
  Highlighter,
  Link2,
  Quote,
  Code,
  List,
  ListOrdered,
  Table as TableIcon,
  AlignLeft,
  Mic,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  className?: string
}

/**
 * Editor de texto enriquecido con barra de herramientas, al estilo del editor de
 * comentarios. Usado en TasksFlow para escribir la Descripción de una tarea.
 * Trabaja sobre un contenedor editable (HTML) y notifica los cambios con onChange.
 */
export function RichTextEditor({ value = "", onChange, placeholder = "Escribe un comentario o arrastra una imagen aquí…", className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initialized = useRef(false)
  const [isEmpty, setIsEmpty] = useState(!value)
  const [listening, setListening] = useState(false)

  // Cargar el contenido inicial una sola vez para no reposicionar el cursor.
  useEffect(() => {
    if (editorRef.current && !initialized.current) {
      editorRef.current.innerHTML = value || ""
      initialized.current = true
      setIsEmpty(!editorRef.current.textContent?.trim())
    }
  }, [value])

  const emitChange = () => {
    const html = editorRef.current?.innerHTML || ""
    setIsEmpty(!editorRef.current?.textContent?.trim())
    onChange?.(html)
  }

  const focusEditor = () => editorRef.current?.focus()

  const exec = (command: string, arg?: string) => {
    focusEditor()
    try {
      document.execCommand("styleWithCSS", false, "true")
      document.execCommand(command, false, arg)
    } catch {
      /* noop */
    }
    emitChange()
  }

  const insertHTML = (html: string) => {
    focusEditor()
    try {
      document.execCommand("insertHTML", false, html)
    } catch {
      /* noop */
    }
    emitChange()
  }

  const handleImage = () => {
    const url = window.prompt("URL de la imagen")
    if (url) insertHTML(`<img src="${url}" alt="" style="max-width:100%;border-radius:6px;" />`)
  }

  const handleAttach = () => fileInputRef.current?.click()

  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const isImg = file.type.startsWith("image/")
      const objectUrl = URL.createObjectURL(file)
      if (isImg) {
        insertHTML(`<img src="${objectUrl}" alt="${file.name}" style="max-width:100%;border-radius:6px;" />`)
      } else {
        insertHTML(`<a href="${objectUrl}" target="_blank" rel="noopener">${file.name}</a>&nbsp;`)
      }
    }
    e.target.value = ""
  }

  const handleLink = () => {
    const url = window.prompt("URL del enlace")
    if (url) exec("createLink", url)
  }

  const handleTable = () =>
    insertHTML(
      `<table style="border-collapse:collapse;width:100%;margin:8px 0;">
        <tbody>
          <tr><td style="border:1px solid #d4d4d8;padding:6px;">&nbsp;</td><td style="border:1px solid #d4d4d8;padding:6px;">&nbsp;</td></tr>
          <tr><td style="border:1px solid #d4d4d8;padding:6px;">&nbsp;</td><td style="border:1px solid #d4d4d8;padding:6px;">&nbsp;</td></tr>
        </tbody>
      </table><p><br/></p>`,
    )

  const handleDictation = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    if (!SpeechRecognition) {
      window.alert("El dictado por voz no está disponible en este navegador.")
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRecognition as any)()
    recognition.lang = "es-ES"
    recognition.interimResults = false
    setListening(true)
    recognition.onresult = (event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => {
      const transcript = event.results[0][0].transcript
      insertHTML(`${transcript} `)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognition.start()
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const objectUrl = URL.createObjectURL(file)
      insertHTML(`<img src="${objectUrl}" alt="${file.name}" style="max-width:100%;border-radius:6px;" />`)
    }
  }

  const toolbar: { icon: React.ElementType; label: string; onClick: () => void; active?: boolean }[] = [
    { icon: ImageIcon, label: "Insertar imagen", onClick: handleImage },
    { icon: Paperclip, label: "Adjuntar archivo", onClick: handleAttach },
    { icon: Bold, label: "Negrita", onClick: () => exec("bold") },
    { icon: Italic, label: "Cursiva", onClick: () => exec("italic") },
    { icon: Strikethrough, label: "Tachado", onClick: () => exec("strikeThrough") },
    { icon: Type, label: "Encabezado", onClick: () => exec("formatBlock", "<h3>") },
    { icon: Highlighter, label: "Resaltar", onClick: () => exec("hiliteColor", "#fef08a") },
    { icon: Link2, label: "Enlace", onClick: handleLink },
    { icon: Quote, label: "Cita", onClick: () => exec("formatBlock", "<blockquote>") },
    { icon: Code, label: "Código", onClick: () => exec("formatBlock", "<pre>") },
    { icon: List, label: "Lista con viñetas", onClick: () => exec("insertUnorderedList") },
    { icon: ListOrdered, label: "Lista numerada", onClick: () => exec("insertOrderedList") },
    { icon: TableIcon, label: "Insertar tabla", onClick: handleTable },
    { icon: AlignLeft, label: "Alinear a la izquierda", onClick: () => exec("justifyLeft") },
    { icon: Mic, label: "Dictado por voz", onClick: handleDictation, active: listening },
  ]

  return (
    <div className={cn("rounded-lg border bg-background", className)}>
      {/* Barra de herramientas */}
      <div className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5">
        {toolbar.map(({ icon: Icon, label, onClick, active }, i) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              active && "bg-primary/10 text-primary",
              // pequeño separador visual tras adjuntar y tras código
              (i === 1 || i === 9) && "mr-1",
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      {/* Área editable */}
      <div className="relative">
        {isEmpty && (
          <span className="pointer-events-none absolute left-3 top-3 text-sm text-muted-foreground">{placeholder}</span>
        )}
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-label="Editor de descripción"
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onBlur={emitChange}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="prose prose-sm dark:prose-invert min-h-[120px] max-w-none px-3 py-3 text-sm leading-relaxed focus:outline-none [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:font-mono [&_ul]:list-disc [&_ul]:pl-5"
        />
      </div>

      <input ref={fileInputRef} type="file" className="hidden" onChange={onFilePicked} />
    </div>
  )
}
