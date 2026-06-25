import { Fragment } from "react"

// Renderiza texto que usa la sintaxis **negritas** convirtiéndola en <strong>.
// Permite resaltar palabras dentro de descripciones y preguntas de las plantillas.
export function RichText({ text, className }: { text?: string | null; className?: string }) {
  if (!text) return null

  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        return <Fragment key={i}>{part}</Fragment>
      })}
    </span>
  )
}
