"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { StickyNote, Pencil, Trash2, Check, X } from "lucide-react"
import { toast } from "sonner"

interface NoteUser {
  first_name: string | null
  last_name: string | null
  email: string | null
}

interface PayrollNote {
  id: string
  content: string
  created_at: string
  updated_at: string | null
  deleted_at: string | null
  created_by_user: NoteUser | null
  updated_by_user: NoteUser | null
  deleted_by_user: NoteUser | null
}

function userLabel(u: NoteUser | null): string {
  if (!u) return "Usuario desconocido"
  const name = `${u.first_name || ""} ${u.last_name || ""}`.trim()
  return name || u.email || "Usuario desconocido"
}

function formatDateTime(iso: string | null): string {
  if (!iso) return ""
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Campos de usuario embebidos por cada FK (created_by / updated_by / deleted_by).
const NOTE_SELECT =
  "id, content, created_at, updated_at, deleted_at, " +
  "created_by_user:users!created_by(first_name, last_name, email), " +
  "updated_by_user:users!updated_by(first_name, last_name, email), " +
  "deleted_by_user:users!deleted_by(first_name, last_name, email)"

export function PayrollNotes({ periodId }: { periodId: string }) {
  const supabase = createClient()

  const [notes, setNotes] = useState<PayrollNote[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [newNote, setNewNote] = useState("")
  const [saving, setSaving] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")

  const [noteToDelete, setNoteToDelete] = useState<PayrollNote | null>(null)

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from("payroll_notes")
      .select(NOTE_SELECT)
      .eq("payroll_period_id", periodId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching payroll notes:", error)
    } else {
      setNotes((data as unknown as PayrollNote[]) || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null))
    fetchNotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodId])

  const handleAdd = async () => {
    const content = newNote.trim()
    if (!content) return
    setSaving(true)
    const { error } = await supabase.from("payroll_notes").insert({
      payroll_period_id: periodId,
      content,
      created_by: currentUserId,
    })
    if (error) {
      console.error("Error creating note:", error)
      toast.error("No se pudo guardar la nota")
    } else {
      setNewNote("")
      toast.success("Nota agregada")
      await fetchNotes()
    }
    setSaving(false)
  }

  const startEdit = (note: PayrollNote) => {
    setEditingId(note.id)
    setEditingContent(note.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingContent("")
  }

  const handleSaveEdit = async (note: PayrollNote) => {
    const content = editingContent.trim()
    if (!content) return
    // Registrar quién y cuándo editó.
    const { error } = await supabase
      .from("payroll_notes")
      .update({
        content,
        updated_by: currentUserId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", note.id)
    if (error) {
      console.error("Error updating note:", error)
      toast.error("No se pudo editar la nota")
    } else {
      toast.success("Nota editada")
      cancelEdit()
      await fetchNotes()
    }
  }

  const handleDelete = async () => {
    if (!noteToDelete) return
    // Borrado suave: se conserva el registro y se guarda quién y cuándo eliminó.
    const { error } = await supabase
      .from("payroll_notes")
      .update({
        deleted_by: currentUserId,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", noteToDelete.id)
    if (error) {
      console.error("Error deleting note:", error)
      toast.error("No se pudo eliminar la nota")
    } else {
      toast.success("Nota eliminada")
      await fetchNotes()
    }
    setNoteToDelete(null)
  }

  const activeNotes = notes.filter((n) => !n.deleted_at)
  const deletedNotes = notes.filter((n) => n.deleted_at)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StickyNote className="h-5 w-5" />
          Notas
        </CardTitle>
        <CardDescription>
          Notas sobre este periodo de nómina. Se registra quién las crea, edita o elimina, con fecha y hora.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alta de nota */}
        <div className="space-y-2">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Escribe una nota sobre este periodo..."
            rows={3}
          />
          <div className="flex justify-end">
            <Button onClick={handleAdd} disabled={saving || !newNote.trim()}>
              {saving && <Spinner className="mr-2 h-4 w-4" />}
              Agregar nota
            </Button>
          </div>
        </div>

        {/* Lista de notas */}
        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner className="h-6 w-6" />
          </div>
        ) : activeNotes.length === 0 && deletedNotes.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No hay notas para este periodo todavía.
          </p>
        ) : (
          <div className="space-y-3">
            {activeNotes.map((note) => (
              <div key={note.id} className="rounded-md border p-4">
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={cancelEdit}>
                        <X className="mr-1 h-4 w-4" />
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={() => handleSaveEdit(note)} disabled={!editingContent.trim()}>
                        <Check className="mr-1 h-4 w-4" />
                        Guardar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <p className="whitespace-pre-wrap text-sm text-pretty">{note.content}</p>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => startEdit(note)}
                          title="Editar nota"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setNoteToDelete(note)}
                          title="Eliminar nota"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                      <p>
                        Creada por {userLabel(note.created_by_user)} el {formatDateTime(note.created_at)}
                      </p>
                      {note.updated_at && (
                        <p>
                          Editada por {userLabel(note.updated_by_user)} el {formatDateTime(note.updated_at)}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Notas eliminadas: se conservan como historial de auditoría */}
            {deletedNotes.length > 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Notas eliminadas
                </p>
                {deletedNotes.map((note) => (
                  <div key={note.id} className="rounded-md border border-dashed bg-muted/40 p-4">
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground line-through text-pretty">
                      {note.content}
                    </p>
                    <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                      <p>
                        Creada por {userLabel(note.created_by_user)} el {formatDateTime(note.created_at)}
                      </p>
                      {note.updated_at && (
                        <p>
                          Editada por {userLabel(note.updated_by_user)} el {formatDateTime(note.updated_at)}
                        </p>
                      )}
                      <p className="font-medium text-destructive">
                        Eliminada por {userLabel(note.deleted_by_user)} el {formatDateTime(note.deleted_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta nota?</AlertDialogTitle>
            <AlertDialogDescription>
              La nota se marcará como eliminada y se conservará en el historial, registrando quién y cuándo la eliminó.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
