"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import {
  ArrowLeft,
  FolderOpen,
  File,
  FileText,
  FileImage,
  FileVideo,
  FilePlus,
  Upload,
  Download,
  Trash2,
  MoreVertical,
  Search,
  Grid,
  List,
  ExternalLink,
  Link2,
  Image as ImageIcon,
  Palette,
  Type,
  Layers,
  FolderPlus,
  ChevronRight,
  Clock,
  User,
} from "lucide-react"
import { mockBrands } from "@/lib/marketing-intelligence/brand-mock-data"

// Mock folder structure
const mockFolders = [
  { 
    id: "logos", 
    name: "Logos", 
    icon: ImageIcon, 
    color: "#3b82f6",
    files: [
      { id: "logo1", name: "Logo Principal.svg", type: "svg", size: "45 KB", modified: "2024-03-15", modifiedBy: "Ana López" },
      { id: "logo2", name: "Logo Blanco.png", type: "png", size: "128 KB", modified: "2024-03-15", modifiedBy: "Ana López" },
      { id: "logo3", name: "Logo Negro.png", type: "png", size: "124 KB", modified: "2024-03-15", modifiedBy: "Ana López" },
      { id: "logo4", name: "Isotipo.svg", type: "svg", size: "12 KB", modified: "2024-03-10", modifiedBy: "Carlos Ruiz" },
      { id: "logo5", name: "Favicon.ico", type: "ico", size: "4 KB", modified: "2024-03-10", modifiedBy: "Carlos Ruiz" },
    ]
  },
  { 
    id: "colors", 
    name: "Paleta de Colores", 
    icon: Palette, 
    color: "#ec4899",
    files: [
      { id: "color1", name: "Brand Colors.pdf", type: "pdf", size: "2.1 MB", modified: "2024-03-01", modifiedBy: "Ana López" },
      { id: "color2", name: "Color Palette.ase", type: "ase", size: "8 KB", modified: "2024-03-01", modifiedBy: "Ana López" },
    ]
  },
  { 
    id: "typography", 
    name: "Tipografías", 
    icon: Type, 
    color: "#8b5cf6",
    files: [
      { id: "font1", name: "Montserrat-Regular.ttf", type: "ttf", size: "245 KB", modified: "2024-02-20", modifiedBy: "Carlos Ruiz" },
      { id: "font2", name: "Montserrat-Bold.ttf", type: "ttf", size: "248 KB", modified: "2024-02-20", modifiedBy: "Carlos Ruiz" },
      { id: "font3", name: "OpenSans-Regular.ttf", type: "ttf", size: "217 KB", modified: "2024-02-20", modifiedBy: "Carlos Ruiz" },
    ]
  },
  { 
    id: "templates", 
    name: "Templates", 
    icon: Layers, 
    color: "#f59e0b",
    files: [
      { id: "temp1", name: "Post Instagram.psd", type: "psd", size: "15.4 MB", modified: "2024-03-20", modifiedBy: "Ana López" },
      { id: "temp2", name: "Story Template.psd", type: "psd", size: "8.2 MB", modified: "2024-03-20", modifiedBy: "Ana López" },
      { id: "temp3", name: "Facebook Cover.psd", type: "psd", size: "12.1 MB", modified: "2024-03-18", modifiedBy: "Carlos Ruiz" },
      { id: "temp4", name: "LinkedIn Banner.psd", type: "psd", size: "10.5 MB", modified: "2024-03-18", modifiedBy: "Carlos Ruiz" },
      { id: "temp5", name: "Email Header.html", type: "html", size: "45 KB", modified: "2024-03-15", modifiedBy: "Ana López" },
    ]
  },
  { 
    id: "photos", 
    name: "Fotografía", 
    icon: ImageIcon, 
    color: "#10b981",
    files: [
      { id: "photo1", name: "Hero Image 1.jpg", type: "jpg", size: "3.2 MB", modified: "2024-03-25", modifiedBy: "Fotógrafo Externo" },
      { id: "photo2", name: "Hero Image 2.jpg", type: "jpg", size: "2.8 MB", modified: "2024-03-25", modifiedBy: "Fotógrafo Externo" },
      { id: "photo3", name: "Team Photo.jpg", type: "jpg", size: "4.1 MB", modified: "2024-03-20", modifiedBy: "Fotógrafo Externo" },
      { id: "photo4", name: "Office Interior.jpg", type: "jpg", size: "3.5 MB", modified: "2024-03-20", modifiedBy: "Fotógrafo Externo" },
    ]
  },
  { 
    id: "videos", 
    name: "Videos", 
    icon: FileVideo, 
    color: "#ef4444",
    files: [
      { id: "video1", name: "Brand Video 2024.mp4", type: "mp4", size: "156 MB", modified: "2024-03-28", modifiedBy: "Productora" },
      { id: "video2", name: "Testimonial Cliente.mp4", type: "mp4", size: "89 MB", modified: "2024-03-22", modifiedBy: "Productora" },
      { id: "video3", name: "Behind the Scenes.mp4", type: "mp4", size: "234 MB", modified: "2024-03-15", modifiedBy: "Carlos Ruiz" },
    ]
  },
  { 
    id: "documents", 
    name: "Documentos", 
    icon: FileText, 
    color: "#6366f1",
    files: [
      { id: "doc1", name: "Brand Guidelines.pdf", type: "pdf", size: "8.5 MB", modified: "2024-03-01", modifiedBy: "Ana López" },
      { id: "doc2", name: "Tone of Voice Guide.pdf", type: "pdf", size: "2.3 MB", modified: "2024-03-01", modifiedBy: "Ana López" },
      { id: "doc3", name: "Social Media Playbook.pdf", type: "pdf", size: "5.1 MB", modified: "2024-02-28", modifiedBy: "Carlos Ruiz" },
      { id: "doc4", name: "Content Calendar Q2.xlsx", type: "xlsx", size: "156 KB", modified: "2024-03-30", modifiedBy: "Ana López" },
    ]
  },
]

export default function BrandAssetsPage() {
  const params = useParams()
  const brandId = params.id as string
  
  const brand = mockBrands.find(b => b.id === brandId)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [driveConnected, setDriveConnected] = useState(false)
  
  if (!brand) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Marca no encontrada</p>
      </div>
    )
  }
  
  const currentFolder = selectedFolder 
    ? mockFolders.find(f => f.id === selectedFolder) 
    : null
  
  const getFileIcon = (type: string) => {
    switch (type) {
      case "jpg":
      case "png":
      case "svg":
      case "gif":
      case "ico":
        return <FileImage className="h-8 w-8 text-green-600" />
      case "mp4":
      case "mov":
      case "avi":
        return <FileVideo className="h-8 w-8 text-red-600" />
      case "pdf":
        return <FileText className="h-8 w-8 text-red-500" />
      case "psd":
      case "ai":
        return <Layers className="h-8 w-8 text-blue-600" />
      case "ttf":
      case "otf":
      case "woff":
        return <Type className="h-8 w-8 text-purple-600" />
      default:
        return <File className="h-8 w-8 text-gray-500" />
    }
  }
  
  const totalFiles = mockFolders.reduce((sum, folder) => sum + folder.files.length, 0)
  const totalSize = "1.2 GB" // Mock total size

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/orbit-marketing-intelligence/brands/${brandId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Activos de Marca</h1>
            <p className="text-muted-foreground">{brand.name} - Biblioteca de recursos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!driveConnected ? (
            <Button variant="outline" onClick={() => {
              setDriveConnected(true)
              toast.success("Google Drive conectado")
            }}>
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M7.71 3.5L1.15 15l3.43 5.5h13.14l3.43-5.5L14.59 3.5H7.71zm.79 1h5l5.14 8.5H3.36L8.5 4.5z"/>
              </svg>
              Conectar Google Drive
            </Button>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <svg className="h-3 w-3" viewBox="0 0 24 24">
                <path fill="currentColor" d="M7.71 3.5L1.15 15l3.43 5.5h13.14l3.43-5.5L14.59 3.5H7.71zm.79 1h5l5.14 8.5H3.36L8.5 4.5z"/>
              </svg>
              Drive conectado
            </Badge>
          )}
          <Button variant="outline">
            <FolderPlus className="h-4 w-4 mr-2" />
            Nueva Carpeta
          </Button>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Subir Archivo
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Archivos</p>
            <p className="text-2xl font-bold">{totalFiles}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Carpetas</p>
            <p className="text-2xl font-bold">{mockFolders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Espacio Usado</p>
            <p className="text-2xl font-bold">{totalSize}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Última Actualización</p>
            <p className="text-2xl font-bold">Hoy</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {selectedFolder && (
            <div className="flex items-center gap-2 text-sm">
              <button 
                onClick={() => setSelectedFolder(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                Activos
              </button>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{currentFolder?.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar archivos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      {!selectedFolder ? (
        // Folders Grid
        <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-4" : "grid-cols-1"}`}>
          {mockFolders.map((folder) => {
            const Icon = folder.icon
            return (
              <Card 
                key={folder.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedFolder(folder.id)}
              >
                <CardContent className={`p-4 ${viewMode === "list" ? "flex items-center gap-4" : ""}`}>
                  <div 
                    className={`${viewMode === "grid" ? "mb-3" : ""} p-3 rounded-lg w-fit`}
                    style={{ backgroundColor: `${folder.color}20` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: folder.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{folder.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {folder.files.length} archivos
                    </p>
                  </div>
                  {viewMode === "list" && (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        // Files View
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setSelectedFolder(null)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  {currentFolder && (
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${currentFolder.color}20` }}
                    >
                      <currentFolder.icon className="h-5 w-5" style={{ color: currentFolder.color }} />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{currentFolder?.name}</CardTitle>
                    <CardDescription>{currentFolder?.files.length} archivos</CardDescription>
                  </div>
                </div>
              </div>
              <Button size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Subir a esta carpeta
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-5 gap-4">
                {currentFolder?.files.map((file) => (
                  <div 
                    key={file.id}
                    className="group relative p-4 border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Descargar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link2 className="h-4 w-4 mr-2" />
                            Copiar enlace
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir en Drive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      {getFileIcon(file.type)}
                      <p className="mt-2 text-sm font-medium truncate w-full">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {currentFolder?.files.map((file) => (
                  <div 
                    key={file.id}
                    className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{file.size}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {file.modified}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {file.modifiedBy}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link2 className="h-4 w-4 mr-2" />
                          Copiar enlace
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Abrir en Drive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
