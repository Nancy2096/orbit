"use client"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Upload, 
  X, 
  Download, 
  Trash2, 
  Eye,
  CheckCircle2,
  AlertCircle,
  FileImage,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
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

interface StaffDocument {
  id: string
  document_type: string
  file_name: string
  file_url: string
  file_size: number | null
  mime_type: string | null
  uploaded_at: string
  notes: string | null
}

interface DocumentType {
  id: string
  label: string
  description: string
  required: boolean
}

const DOCUMENT_TYPES: DocumentType[] = [
  { id: "acta_nacimiento", label: "Acta de Nacimiento", description: "Acta de nacimiento del empleado", required: false },
  { id: "carta_interna", label: "Carta Interna", description: "Carta de presentación o recomendación interna", required: false },
  { id: "comprobante_domicilio", label: "Comprobante de Domicilio", description: "Recibo de luz, agua, teléfono o estado de cuenta bancario (no mayor a 3 meses)", required: false },
  { id: "curp", label: "CURP", description: "Clave Única de Registro de Población", required: false },
  { id: "cv", label: "Curriculum Vitae", description: "CV actualizado del empleado", required: false },
  { id: "estado_cuenta", label: "Portada de Estado de Cuenta", description: "Portada del estado de cuenta bancario para validar datos de pago", required: false },
  { id: "identificacion_oficial", label: "Identificación Oficial", description: "INE, pasaporte o cédula profesional", required: false },
  { id: "rfc", label: "RFC", description: "Constancia de Situación Fiscal (RFC)", required: false },
]

interface StaffDocumentsProps {
  staffId?: string // undefined for new staff
  documents?: StaffDocument[]
  onDocumentsChange?: (documents: StaffDocument[]) => void
  pendingUploads?: Map<string, File> // For new staff - files pending upload
  onPendingUploadsChange?: (uploads: Map<string, File>) => void
  readOnly?: boolean
}

export function StaffDocuments({ 
  staffId, 
  documents = [], 
  onDocumentsChange,
  pendingUploads = new Map(),
  onPendingUploadsChange,
  readOnly = false 
}: StaffDocumentsProps) {
  const [uploading, setUploading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; type: string } | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Desconocido"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getDocumentForType = (typeId: string): StaffDocument | undefined => {
    return documents.find(doc => doc.document_type === typeId)
  }

  const getPendingFileForType = (typeId: string): File | undefined => {
    return pendingUploads.get(typeId)
  }

  const handleFileSelect = useCallback(async (typeId: string, file: File) => {
    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de archivo no permitido. Solo PDF, JPG o PNG.")
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error("El archivo es demasiado grande. Máximo 10MB.")
      return
    }

    if (!staffId) {
      // For new staff, store the file for later upload
      const newPendingUploads = new Map(pendingUploads)
      newPendingUploads.set(typeId, file)
      onPendingUploadsChange?.(newPendingUploads)
      toast.success(`${DOCUMENT_TYPES.find(t => t.id === typeId)?.label} seleccionado. Se subirá al guardar.`)
      return
    }

    // For existing staff, upload immediately
    setUploading(typeId)
    
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("staffId", staffId)
      formData.append("documentType", typeId)

      const response = await fetch("/api/staff/documents", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al subir el documento")
      }

      const newDocument = await response.json()
      
      // Update documents list
      const existingIndex = documents.findIndex(d => d.document_type === typeId)
      let updatedDocuments: StaffDocument[]
      
      if (existingIndex >= 0) {
        updatedDocuments = [...documents]
        updatedDocuments[existingIndex] = newDocument
      } else {
        updatedDocuments = [...documents, newDocument]
      }
      
      onDocumentsChange?.(updatedDocuments)
      toast.success("Documento subido correctamente")
    } catch (error) {
      console.error("Error uploading document:", error)
      toast.error(error instanceof Error ? error.message : "Error al subir el documento")
    } finally {
      setUploading(null)
    }
  }, [staffId, documents, onDocumentsChange, pendingUploads, onPendingUploadsChange])

  const handleFileInputChange = (typeId: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(typeId, file)
    }
    // Reset input
    if (fileInputRefs.current[typeId]) {
      fileInputRefs.current[typeId]!.value = ""
    }
  }

  const handleDelete = async () => {
    if (!documentToDelete || !staffId) return

    setDeleting(documentToDelete.id)
    
    try {
      const response = await fetch(`/api/staff/documents?id=${documentToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al eliminar el documento")
      }

      // Update documents list
      const updatedDocuments = documents.filter(d => d.id !== documentToDelete.id)
      onDocumentsChange?.(updatedDocuments)
      toast.success("Documento eliminado correctamente")
    } catch (error) {
      console.error("Error deleting document:", error)
      toast.error(error instanceof Error ? error.message : "Error al eliminar el documento")
    } finally {
      setDeleting(null)
      setDeleteDialogOpen(false)
      setDocumentToDelete(null)
    }
  }

  const handleRemovePending = (typeId: string) => {
    const newPendingUploads = new Map(pendingUploads)
    newPendingUploads.delete(typeId)
    onPendingUploadsChange?.(newPendingUploads)
  }

  const getFileIcon = (mimeType: string | null) => {
    if (mimeType?.startsWith("image/")) {
      return <FileImage className="h-5 w-5 text-blue-500" />
    }
    return <FileText className="h-5 w-5 text-red-500" />
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos
          </CardTitle>
          <CardDescription>
            Sube los documentos requeridos del empleado. Formatos permitidos: PDF, JPG, PNG (máx. 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DOCUMENT_TYPES.map((docType) => {
              const existingDoc = getDocumentForType(docType.id)
              const pendingFile = getPendingFileForType(docType.id)
              const isUploading = uploading === docType.id
              const isDeleting = deleting === existingDoc?.id

              return (
                <div
                  key={docType.id}
                  className="flex items-start gap-4 p-4 border rounded-lg bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{docType.label}</span>
                      {docType.required && (
                        <Badge variant="outline" className="text-xs">Requerido</Badge>
                      )}
                      {(existingDoc || pendingFile) && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {pendingFile ? "Pendiente" : "Cargado"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {docType.description}
                    </p>

                    {/* Show existing document */}
                    {existingDoc && !pendingFile && (
                      <div className="flex items-center gap-2 p-2 bg-background rounded border">
                        {getFileIcon(existingDoc.mime_type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{existingDoc.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(existingDoc.file_size)} • {new Date(existingDoc.uploaded_at).toLocaleDateString("es-MX")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(`/api/staff/documents/file?id=${existingDoc.id}`, "_blank")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                          >
                            <a href={`/api/staff/documents/file?id=${existingDoc.id}&download=1`}>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          {!readOnly && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                setDocumentToDelete({ id: existingDoc.id, type: docType.label })
                                setDeleteDialogOpen(true)
                              }}
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Show pending file for new staff */}
                    {pendingFile && (
                      <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded border border-amber-500/20">
                        {getFileIcon(pendingFile.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{pendingFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(pendingFile.size)} • Pendiente de subir
                          </p>
                        </div>
                        {!readOnly && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemovePending(docType.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Upload button */}
                  {!readOnly && (
                    <div className="flex-shrink-0">
                      <input
                        ref={(el) => { fileInputRefs.current[docType.id] = el }}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={handleFileInputChange(docType.id)}
                        disabled={isUploading}
                      />
                      <Button
                        type="button"
                        variant={existingDoc || pendingFile ? "outline" : "default"}
                        size="sm"
                        onClick={() => fileInputRefs.current[docType.id]?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            {existingDoc || pendingFile ? "Reemplazar" : "Subir"}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}

            {!staffId && pendingUploads.size > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  Los documentos seleccionados se subirán automáticamente al guardar el nuevo miembro.
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar documento</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el documento &quot;{documentToDelete?.type}&quot;? 
              Esta acción no se puede deshacer.
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
    </>
  )
}

// Export document types for use in other components
export { DOCUMENT_TYPES }
export type { StaffDocument, DocumentType }
