"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Video, 
  FileText, 
  Link as LinkIcon, 
  Presentation,
  Users,
  BookOpen,
  GraduationCap,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  Eye,
  PlayCircle,
  FolderOpen,
  Settings,
  ClipboardList,
  BarChart3,
  AlertCircle,
  ChevronRight,
  Loader2,
  Upload
} from "lucide-react"
import { upload } from "@vercel/blob/client"

const supabase = createClient()

interface Agency {
  id: string
  name: string
}

interface Category {
  id: string
  agency_id: string
  name: string
  description: string | null
  color: string
  is_active: boolean
}

interface Course {
  id: string
  agency_id: string
  category_id: string | null
  title: string
  description: string | null
  thumbnail_url: string | null
  duration_minutes: number
  passing_score: number
  is_mandatory: boolean
  is_active: boolean
  created_at: string
  category?: Category
  content_count?: number
  enrollment_count?: number
}

interface CourseContent {
  id: string
  course_id: string
  title: string
  description: string | null
  content_type: string
  content_url: string
  duration_minutes: number
  sort_order: number
  is_required: boolean
}

interface Evaluation {
  id: string
  course_id: string
  title: string
  description: string | null
  time_limit_minutes: number | null
  max_attempts: number
  shuffle_questions: boolean
  show_correct_answers: boolean
  is_active: boolean
  questions_count?: number
}

interface EvaluationQuestion {
  id: string
  evaluation_id: string
  question_text: string
  question_type: string
  options: { id: string; text: string; is_correct: boolean }[]
  points: number
  sort_order: number
  explanation: string | null
}

interface Staff {
  id: string
  first_name: string
  last_name: string
  email: string
  position: string | null
  department_id: string | null
  department?: { name: string }
}

interface Enrollment {
  id: string
  course_id: string
  staff_id: string
  status: string
  progress_percentage: number
  started_at: string | null
  completed_at: string | null
  final_score: number | null
  staff?: Staff
  course?: Course
}

export default function TrainingPage() {
  const [activeTab, setActiveTab] = useState("courses")
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [selectedAgency, setSelectedAgency] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Categories
  const [categories, setCategories] = useState<Category[]>([])
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategory, setNewCategory] = useState({ name: "", description: "", color: "#6366f1" })

  // Courses
  const [courses, setCourses] = useState<Course[]>([])
  const [showCourseDialog, setShowCourseDialog] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [newCourse, setNewCourse] = useState({
    category_id: "",
    title: "",
    description: "",
    duration_minutes: 0,
    passing_score: 70,
    is_mandatory: false,
    is_active: true
  })

  // Course Content
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [courseContents, setCourseContents] = useState<CourseContent[]>([])
  const [showContentDialog, setShowContentDialog] = useState(false)
  const [editingContent, setEditingContent] = useState<CourseContent | null>(null)
  const [newContent, setNewContent] = useState({
    title: "",
    description: "",
    content_type: "video",
    content_url: "",
    duration_minutes: 0,
    is_required: true
  })

  // Evaluations
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false)
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null)
  const [newEvaluation, setNewEvaluation] = useState({
    title: "",
    description: "",
    time_limit_minutes: null as number | null,
    max_attempts: 3,
    shuffle_questions: true,
    show_correct_answers: false
  })

  // Questions
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null)
  const [questions, setQuestions] = useState<EvaluationQuestion[]>([])
  const [showQuestionDialog, setShowQuestionDialog] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<EvaluationQuestion | null>(null)
  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    question_type: "multiple_choice",
    options: [
      { id: "1", text: "", is_correct: false },
      { id: "2", text: "", is_correct: false },
      { id: "3", text: "", is_correct: false },
      { id: "4", text: "", is_correct: false }
    ],
    points: 1,
    explanation: ""
  })

  // Subida de material de capacitación
  const [uploadingContent, setUploadingContent] = useState(false)

  // Enrollments & Team View
  const [staff, setStaff] = useState<Staff[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [showEnrollDialog, setShowEnrollDialog] = useState(false)
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])
  const [enrollCourseId, setEnrollCourseId] = useState("")

  useEffect(() => {
    fetchAgencies()
  }, [])

  useEffect(() => {
    if (selectedAgency) {
      fetchCategories()
      fetchCourses()
      fetchStaff()
      fetchEnrollments()
    }
  }, [selectedAgency])

  const fetchAgencies = async () => {
    const { data } = await supabase.from("agencies").select("id, name").order("name")
    if (data && data.length > 0) {
      setAgencies(data)
      setSelectedAgency(data[0].id)
    }
    setLoading(false)
  }

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("training_categories")
      .select("*")
      .eq("agency_id", selectedAgency)
      .order("name")
    if (data) setCategories(data)
  }

  const fetchCourses = async () => {
    const { data } = await supabase
      .from("training_courses")
      .select(`
        *,
        category:training_categories(id, name, color)
      `)
      .eq("agency_id", selectedAgency)
      .order("title")
    
    if (data) {
      // Get content and enrollment counts
      const coursesWithCounts = await Promise.all(data.map(async (course) => {
        const { count: contentCount } = await supabase
          .from("training_course_content")
          .select("*", { count: "exact", head: true })
          .eq("course_id", course.id)
        
        const { count: enrollmentCount } = await supabase
          .from("training_enrollments")
          .select("*", { count: "exact", head: true })
          .eq("course_id", course.id)

        return {
          ...course,
          content_count: contentCount || 0,
          enrollment_count: enrollmentCount || 0
        }
      }))
      setCourses(coursesWithCounts)
    }
  }

  const fetchCourseContent = async (courseId: string) => {
    const { data } = await supabase
      .from("training_course_content")
      .select("*")
      .eq("course_id", courseId)
      .order("sort_order")
    if (data) setCourseContents(data)
  }

  const fetchEvaluations = async (courseId: string) => {
    const { data } = await supabase
      .from("training_evaluations")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at")
    
    if (data) {
      const evalsWithCounts = await Promise.all(data.map(async (evalItem) => {
        const { count } = await supabase
          .from("training_evaluation_questions")
          .select("*", { count: "exact", head: true })
          .eq("evaluation_id", evalItem.id)
        return { ...evalItem, questions_count: count || 0 }
      }))
      setEvaluations(evalsWithCounts)
    }
  }

  const fetchQuestions = async (evaluationId: string) => {
    const { data } = await supabase
      .from("training_evaluation_questions")
      .select("*")
      .eq("evaluation_id", evaluationId)
      .order("sort_order")
    if (data) setQuestions(data)
  }

  const fetchStaff = async () => {
    // Mostrar todo el personal de la agencia: los asignados directamente
    // (agency_id), los asignados a varias agencias (agency_ids) y los globales.
    const { data, error } = await supabase
      .from("staff")
      .select(`
        id, first_name, last_name, email, position, department_id,
        department:departments(name)
      `)
      .eq("is_active", true)
      .or(`agency_id.eq.${selectedAgency},agency_ids.cs.{${selectedAgency}},is_global.eq.true`)
      .order("first_name")
    if (error) {
      console.log("[v0] Error cargando personal:", error.message)
      return
    }
    if (data) setStaff(data)
  }

  const fetchEnrollments = async () => {
    const { data } = await supabase
      .from("training_enrollments")
      .select(`
        *,
        staff:staff(id, first_name, last_name, email, position),
        course:training_courses(id, title, passing_score)
      `)
      .eq("course_id", selectedCourse?.id || courses[0]?.id)
      .order("created_at", { ascending: false })
    if (data) setEnrollments(data)
  }

  // Category handlers
  const handleSaveCategory = async () => {
    if (editingCategory) {
      await supabase
        .from("training_categories")
        .update({ ...newCategory, updated_at: new Date().toISOString() })
        .eq("id", editingCategory.id)
    } else {
      await supabase
        .from("training_categories")
        .insert({ ...newCategory, agency_id: selectedAgency })
    }
    setShowCategoryDialog(false)
    setEditingCategory(null)
    setNewCategory({ name: "", description: "", color: "#6366f1" })
    fetchCategories()
  }

  const handleDeleteCategory = async (id: string) => {
    if (confirm("¿Eliminar esta categoría?")) {
      await supabase.from("training_categories").delete().eq("id", id)
      fetchCategories()
    }
  }

  // Course handlers
  const handleSaveCourse = async () => {
    if (editingCourse) {
      await supabase
        .from("training_courses")
        .update({ 
          ...newCourse, 
          category_id: newCourse.category_id || null,
          updated_at: new Date().toISOString() 
        })
        .eq("id", editingCourse.id)
    } else {
      await supabase
        .from("training_courses")
        .insert({ 
          ...newCourse, 
          category_id: newCourse.category_id || null,
          agency_id: selectedAgency 
        })
    }
    setShowCourseDialog(false)
    setEditingCourse(null)
    setNewCourse({
      category_id: "",
      title: "",
      description: "",
      duration_minutes: 0,
      passing_score: 70,
      is_mandatory: false,
      is_active: true
    })
    fetchCourses()
  }

  const handleDeleteCourse = async (id: string) => {
    if (confirm("¿Eliminar este curso y todo su contenido?")) {
      await supabase.from("training_courses").delete().eq("id", id)
      fetchCourses()
    }
  }

  // Sube un archivo (presentación, documento, video) y lo guarda como URL del contenido.
  const handleUploadContentFile = async (file: File) => {
    setUploadingContent(true)
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
      const blob = await upload(`training-content/${Date.now()}-${safeName}`, file, {
        access: "private",
        handleUploadUrl: "/api/training/upload",
        contentType: file.type || undefined,
      })
      // El store es privado, así que servimos el archivo mediante el proxy autenticado.
      const pathname = blob.url.split(".vercel-storage.com/")[1] ?? blob.pathname
      setNewContent((prev) => ({ ...prev, content_url: `/api/file?pathname=${encodeURIComponent(pathname)}` }))
    } catch (error) {
      console.log("[v0] Error al subir archivo de contenido:", (error as Error).message)
      alert("No se pudo subir el archivo. Verifica el tipo y tamaño (máx. 200 MB).")
    } finally {
      setUploadingContent(false)
    }
  }

  // Content handlers
  const handleSaveContent = async () => {
    if (!selectedCourse) return
    
    const sortOrder = editingContent ? editingContent.sort_order : courseContents.length

    if (editingContent) {
      await supabase
        .from("training_course_content")
        .update({ ...newContent, updated_at: new Date().toISOString() })
        .eq("id", editingContent.id)
    } else {
      await supabase
        .from("training_course_content")
        .insert({ ...newContent, course_id: selectedCourse.id, sort_order: sortOrder })
    }
    setShowContentDialog(false)
    setEditingContent(null)
    setNewContent({
      title: "",
      description: "",
      content_type: "video",
      content_url: "",
      duration_minutes: 0,
      is_required: true
    })
    fetchCourseContent(selectedCourse.id)
  }

  const handleDeleteContent = async (id: string) => {
    if (confirm("¿Eliminar este contenido?")) {
      await supabase.from("training_course_content").delete().eq("id", id)
      if (selectedCourse) fetchCourseContent(selectedCourse.id)
    }
  }

  // Evaluation handlers
  const handleSaveEvaluation = async () => {
    if (!selectedCourse) return

    if (editingEvaluation) {
      await supabase
        .from("training_evaluations")
        .update({ ...newEvaluation, updated_at: new Date().toISOString() })
        .eq("id", editingEvaluation.id)
    } else {
      await supabase
        .from("training_evaluations")
        .insert({ ...newEvaluation, course_id: selectedCourse.id })
    }
    setShowEvaluationDialog(false)
    setEditingEvaluation(null)
    setNewEvaluation({
      title: "",
      description: "",
      time_limit_minutes: null,
      max_attempts: 3,
      shuffle_questions: true,
      show_correct_answers: false
    })
    fetchEvaluations(selectedCourse.id)
  }

  const handleDeleteEvaluation = async (id: string) => {
    if (confirm("¿Eliminar esta evaluación y todas sus preguntas?")) {
      await supabase.from("training_evaluations").delete().eq("id", id)
      if (selectedCourse) fetchEvaluations(selectedCourse.id)
    }
  }

  // Question handlers
  const handleSaveQuestion = async () => {
    if (!selectedEvaluation) return

    const sortOrder = editingQuestion ? editingQuestion.sort_order : questions.length

    if (editingQuestion) {
      await supabase
        .from("training_evaluation_questions")
        .update({
          question_text: newQuestion.question_text,
          question_type: newQuestion.question_type,
          options: newQuestion.options,
          points: newQuestion.points,
          explanation: newQuestion.explanation || null
        })
        .eq("id", editingQuestion.id)
    } else {
      await supabase
        .from("training_evaluation_questions")
        .insert({
          evaluation_id: selectedEvaluation.id,
          question_text: newQuestion.question_text,
          question_type: newQuestion.question_type,
          options: newQuestion.options,
          points: newQuestion.points,
          explanation: newQuestion.explanation || null,
          sort_order: sortOrder
        })
    }
    setShowQuestionDialog(false)
    setEditingQuestion(null)
    setNewQuestion({
      question_text: "",
      question_type: "multiple_choice",
      options: [
        { id: "1", text: "", is_correct: false },
        { id: "2", text: "", is_correct: false },
        { id: "3", text: "", is_correct: false },
        { id: "4", text: "", is_correct: false }
      ],
      points: 1,
      explanation: ""
    })
    fetchQuestions(selectedEvaluation.id)
  }

  const handleDeleteQuestion = async (id: string) => {
    if (confirm("¿Eliminar esta pregunta?")) {
      await supabase.from("training_evaluation_questions").delete().eq("id", id)
      if (selectedEvaluation) fetchQuestions(selectedEvaluation.id)
    }
  }

  // Enrollment handlers
  const handleEnrollStaff = async () => {
    if (!enrollCourseId || selectedStaffIds.length === 0) return

    const enrollments = selectedStaffIds.map(staffId => ({
      course_id: enrollCourseId,
      staff_id: staffId,
      status: "enrolled"
    }))

    await supabase.from("training_enrollments").upsert(enrollments, { onConflict: "course_id,staff_id" })
    
    setShowEnrollDialog(false)
    setSelectedStaffIds([])
    setEnrollCourseId("")
    fetchEnrollments()
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="h-4 w-4" />
      case "presentation": return <Presentation className="h-4 w-4" />
      case "document": return <FileText className="h-4 w-4" />
      case "link": return <LinkIcon className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "enrolled": return <Badge variant="secondary">Inscrito</Badge>
      case "in_progress": return <Badge className="bg-blue-100 text-blue-800">En Progreso</Badge>
      case "completed": return <Badge className="bg-green-100 text-green-800">Completado</Badge>
      case "failed": return <Badge variant="destructive">No Aprobado</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Capacitación</h1>
          <p className="text-muted-foreground">Gestiona cursos, contenido y evaluaciones del equipo</p>
        </div>
        <Select value={selectedAgency} onValueChange={setSelectedAgency}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Seleccionar agencia" />
          </SelectTrigger>
          <SelectContent>
            {agencies.map((agency) => (
              <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Activos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.filter(c => c.is_active).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorías</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inscripciones</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.reduce((acc, c) => acc + (c.enrollment_count || 0), 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipo Activo</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Cursos
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Categorías
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Contenido
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Evaluaciones
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Equipo
          </TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => { setEditingCourse(null); setNewCourse({ category_id: "", title: "", description: "", duration_minutes: 0, passing_score: 70, is_mandatory: false, is_active: true }); setShowCourseDialog(true) }}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Curso
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      {course.category && (
                        <Badge style={{ backgroundColor: course.category.color + "20", color: course.category.color }}>
                          {course.category.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditingCourse(course)
                        setNewCourse({
                          category_id: course.category_id || "",
                          title: course.title,
                          description: course.description || "",
                          duration_minutes: course.duration_minutes,
                          passing_score: course.passing_score,
                          is_mandatory: course.is_mandatory,
                          is_active: course.is_active
                        })
                        setShowCourseDialog(true)
                      }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCourse(course.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{course.description || "Sin descripción"}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.duration_minutes} min
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {course.content_count} contenidos
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {course.enrollment_count} inscritos
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      {course.is_mandatory && <Badge variant="destructive">Obligatorio</Badge>}
                      {course.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                      setSelectedCourse(course)
                      fetchCourseContent(course.id)
                      fetchEvaluations(course.id)
                      setActiveTab("content")
                    }}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay cursos creados</p>
                <Button className="mt-4" onClick={() => setShowCourseDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primer Curso
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingCategory(null); setNewCategory({ name: "", description: "", color: "#6366f1" }); setShowCategoryDialog(true) }}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Categoría
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditingCategory(category)
                        setNewCategory({ name: category.name, description: category.description || "", color: category.color })
                        setShowCategoryDialog(true)
                      }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{category.description || "Sin descripción"}</p>
                  <div className="mt-3 text-sm text-muted-foreground">
                    {courses.filter(c => c.category_id === category.id).length} cursos
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {categories.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay categorías creadas</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={selectedCourse?.id || ""} onValueChange={(value) => {
                const course = courses.find(c => c.id === value)
                setSelectedCourse(course || null)
                if (course) {
                  fetchCourseContent(course.id)
                  fetchEvaluations(course.id)
                }
              }}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCourse && (
                <Badge className="bg-blue-100 text-blue-800">
                  {courseContents.length} contenidos
                </Badge>
              )}
            </div>
            {selectedCourse && (
              <Button onClick={() => { setEditingContent(null); setNewContent({ title: "", description: "", content_type: "video", content_url: "", duration_minutes: 0, is_required: true }); setShowContentDialog(true) }}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Contenido
              </Button>
            )}
          </div>

          {selectedCourse ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedCourse.title}</CardTitle>
                <CardDescription>{selectedCourse.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {courseContents.length > 0 ? (
                  <div className="space-y-2">
                    {courseContents.map((content, index) => (
                      <div key={content.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            {getContentIcon(content.content_type)}
                          </div>
                          <div>
                            <p className="font-medium">{content.title}</p>
                            <p className="text-sm text-muted-foreground">{content.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {content.duration_minutes} min
                          </div>
                          {content.is_required && <Badge variant="secondary">Requerido</Badge>}
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => window.open(content.content_url, "_blank")}>
                              <PlayCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => {
                              setEditingContent(content)
                              setNewContent({
                                title: content.title,
                                description: content.description || "",
                                content_type: content.content_type,
                                content_url: content.content_url,
                                duration_minutes: content.duration_minutes,
                                is_required: content.is_required
                              })
                              setShowContentDialog(true)
                            }}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteContent(content.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Video className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay contenido en este curso</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Selecciona un curso para ver su contenido</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Evaluations Tab */}
        <TabsContent value="evaluations" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={selectedCourse?.id || ""} onValueChange={(value) => {
              const course = courses.find(c => c.id === value)
              setSelectedCourse(course || null)
              if (course) {
                fetchEvaluations(course.id)
              }
            }}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Seleccionar curso" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCourse && (
              <Button onClick={() => { setEditingEvaluation(null); setNewEvaluation({ title: "", description: "", time_limit_minutes: null, max_attempts: 3, shuffle_questions: true, show_correct_answers: false }); setShowEvaluationDialog(true) }}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Evaluación
              </Button>
            )}
          </div>

          {selectedCourse ? (
            <div className="space-y-4">
              {evaluations.map((evaluation) => (
                <Card key={evaluation.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{evaluation.title}</CardTitle>
                        <CardDescription>{evaluation.description}</CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => {
                          setEditingEvaluation(evaluation)
                          setNewEvaluation({
                            title: evaluation.title,
                            description: evaluation.description || "",
                            time_limit_minutes: evaluation.time_limit_minutes,
                            max_attempts: evaluation.max_attempts,
                            shuffle_questions: evaluation.shuffle_questions,
                            show_correct_answers: evaluation.show_correct_answers
                          })
                          setShowEvaluationDialog(true)
                        }}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteEvaluation(evaluation.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {evaluation.time_limit_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {evaluation.time_limit_minutes} min
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <ClipboardList className="h-4 w-4" />
                        {evaluation.questions_count} preguntas
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {evaluation.max_attempts} intentos
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Preguntas</h4>
                        <Button size="sm" onClick={() => {
                          setSelectedEvaluation(evaluation)
                          fetchQuestions(evaluation.id)
                          setNewQuestion({
                            question_text: "",
                            question_type: "multiple_choice",
                            options: [
                              { id: "1", text: "", is_correct: false },
                              { id: "2", text: "", is_correct: false },
                              { id: "3", text: "", is_correct: false },
                              { id: "4", text: "", is_correct: false }
                            ],
                            points: 1,
                            explanation: ""
                          })
                          setShowQuestionDialog(true)
                        }}>
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar Pregunta
                        </Button>
                      </div>

                      {selectedEvaluation?.id === evaluation.id && questions.length > 0 && (
                        <div className="space-y-2">
                          {questions.map((question, index) => (
                            <div key={question.id} className="flex items-start justify-between p-3 border rounded-lg">
                              <div className="flex items-start gap-3">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium mt-0.5">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium">{question.question_text}</p>
                                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                    <Badge variant="secondary">{question.question_type === "multiple_choice" ? "Opción múltiple" : question.question_type === "true_false" ? "V/F" : "Selección múltiple"}</Badge>
                                    <span>{question.points} pts</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => {
                                  setEditingQuestion(question)
                                  setNewQuestion({
                                    question_text: question.question_text,
                                    question_type: question.question_type,
                                    options: question.options,
                                    points: question.points,
                                    explanation: question.explanation || ""
                                  })
                                  setShowQuestionDialog(true)
                                }}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(question.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedEvaluation?.id !== evaluation.id && (
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedEvaluation(evaluation)
                          fetchQuestions(evaluation.id)
                        }}>
                          Ver Preguntas
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {evaluations.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay evaluaciones para este curso</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Selecciona un curso para ver sus evaluaciones</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={selectedCourse?.id || ""} onValueChange={(value) => {
                const course = courses.find(c => c.id === value)
                setSelectedCourse(course || null)
              }}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Filtrar por curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los cursos</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => { setShowEnrollDialog(true); setSelectedStaffIds([]); setEnrollCourseId("") }}>
              <Plus className="mr-2 h-4 w-4" />
              Inscribir Empleados
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Equipo y Progreso</CardTitle>
              <CardDescription>Vista del estado de capacitación de cada miembro del equipo</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Puesto</TableHead>
                    <TableHead>Cursos Inscritos</TableHead>
                    <TableHead>Completados</TableHead>
                    <TableHead>En Progreso</TableHead>
                    <TableHead>Promedio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => {
                    const memberEnrollments = enrollments.filter(e => e.staff_id === member.id)
                    const completed = memberEnrollments.filter(e => e.status === "completed").length
                    const inProgress = memberEnrollments.filter(e => e.status === "in_progress").length
                    const avgScore = memberEnrollments.filter(e => e.final_score).reduce((acc, e) => acc + (e.final_score || 0), 0) / (memberEnrollments.filter(e => e.final_score).length || 1)
                    
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{member.first_name} {member.last_name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{member.position || "-"}</TableCell>
                        <TableCell>{memberEnrollments.length}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">{completed}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800">{inProgress}</Badge>
                        </TableCell>
                        <TableCell>
                          {memberEnrollments.filter(e => e.final_score).length > 0 ? (
                            <span className={avgScore >= 70 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                              {avgScore.toFixed(0)}%
                            </span>
                          ) : "-"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Detailed Enrollments */}
          <Card>
            <CardHeader>
              <CardTitle>Inscripciones Detalladas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Calificación</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead>Fecha Completado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        {enrollment.staff?.first_name} {enrollment.staff?.last_name}
                      </TableCell>
                      <TableCell>{enrollment.course?.title}</TableCell>
                      <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={enrollment.progress_percentage} className="w-20 h-2" />
                          <span className="text-sm text-muted-foreground">{enrollment.progress_percentage}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {enrollment.final_score !== null ? (
                          <span className={enrollment.final_score >= (enrollment.course?.passing_score || 70) ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            {enrollment.final_score}%
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {enrollment.started_at ? new Date(enrollment.started_at).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>
                        {enrollment.completed_at ? new Date(enrollment.completed_at).toLocaleDateString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Ej: Ventas, Marketing, Técnico..."
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Descripción de la categoría"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveCategory} disabled={!newCategory.name}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course Dialog */}
      <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Editar Curso" : "Nuevo Curso"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={newCourse.title}
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                placeholder="Título del curso"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={newCourse.category_id || "none"} onValueChange={(value) => setNewCourse({ ...newCourse, category_id: value === "none" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={newCourse.description}
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                placeholder="Descripción del curso"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duración (min)</Label>
                <Input
                  type="number"
                  value={newCourse.duration_minutes}
                  onChange={(e) => setNewCourse({ ...newCourse, duration_minutes: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Puntuación mínima (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={newCourse.passing_score}
                  onChange={(e) => setNewCourse({ ...newCourse, passing_score: parseInt(e.target.value) || 70 })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={newCourse.is_mandatory}
                  onCheckedChange={(checked) => setNewCourse({ ...newCourse, is_mandatory: checked })}
                />
                <Label>Curso obligatorio</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={newCourse.is_active}
                  onCheckedChange={(checked) => setNewCourse({ ...newCourse, is_active: checked })}
                />
                <Label>Activo</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCourseDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveCourse} disabled={!newCourse.title}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content Dialog */}
      <Dialog open={showContentDialog} onOpenChange={setShowContentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContent ? "Editar Contenido" : "Agregar Contenido"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={newContent.title}
                onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                placeholder="Título del contenido"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Contenido *</Label>
              <Select value={newContent.content_type} onValueChange={(value) => setNewContent({ ...newContent, content_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="presentation">Presentación</SelectItem>
                  <SelectItem value="document">Documento</SelectItem>
                  <SelectItem value="link">Enlace</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Archivo o URL del Contenido *</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingContent}
                  onClick={() => document.getElementById("training-content-file")?.click()}
                >
                  {uploadingContent ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" /> Subir archivo
                    </>
                  )}
                </Button>
                <span className="text-sm text-muted-foreground">
                  Presentación, PDF, documento o video (máx. 200 MB)
                </span>
                <input
                  id="training-content-file"
                  type="file"
                  className="hidden"
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void handleUploadContentFile(file)
                    e.target.value = ""
                  }}
                />
              </div>
              <Input
                value={newContent.content_url}
                onChange={(e) => setNewContent({ ...newContent, content_url: e.target.value })}
                placeholder="https://... o sube un archivo arriba"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={newContent.description}
                onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                placeholder="Descripción del contenido"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duración (min)</Label>
                <Input
                  type="number"
                  value={newContent.duration_minutes}
                  onChange={(e) => setNewContent({ ...newContent, duration_minutes: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2 pt-8">
                <Switch
                  checked={newContent.is_required}
                  onCheckedChange={(checked) => setNewContent({ ...newContent, is_required: checked })}
                />
                <Label>Requerido</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContentDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveContent} disabled={!newContent.title || !newContent.content_url}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evaluation Dialog */}
      <Dialog open={showEvaluationDialog} onOpenChange={setShowEvaluationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEvaluation ? "Editar Evaluación" : "Nueva Evaluación"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={newEvaluation.title}
                onChange={(e) => setNewEvaluation({ ...newEvaluation, title: e.target.value })}
                placeholder="Título de la evaluación"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={newEvaluation.description}
                onChange={(e) => setNewEvaluation({ ...newEvaluation, description: e.target.value })}
                placeholder="Instrucciones para la evaluación"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tiempo límite (min)</Label>
                <Input
                  type="number"
                  value={newEvaluation.time_limit_minutes || ""}
                  onChange={(e) => setNewEvaluation({ ...newEvaluation, time_limit_minutes: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Sin límite"
                />
              </div>
              <div className="space-y-2">
                <Label>Intentos máximos</Label>
                <Input
                  type="number"
                  min={1}
                  value={newEvaluation.max_attempts}
                  onChange={(e) => setNewEvaluation({ ...newEvaluation, max_attempts: parseInt(e.target.value) || 3 })}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={newEvaluation.shuffle_questions}
                  onCheckedChange={(checked) => setNewEvaluation({ ...newEvaluation, shuffle_questions: checked })}
                />
                <Label>Mezclar preguntas</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={newEvaluation.show_correct_answers}
                  onCheckedChange={(checked) => setNewEvaluation({ ...newEvaluation, show_correct_answers: checked })}
                />
                <Label>Mostrar respuestas correctas al finalizar</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEvaluationDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveEvaluation} disabled={!newEvaluation.title}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? "Editar Pregunta" : "Nueva Pregunta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pregunta *</Label>
              <Textarea
                value={newQuestion.question_text}
                onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                placeholder="Escribe la pregunta..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Pregunta</Label>
                <Select value={newQuestion.question_type} onValueChange={(value) => setNewQuestion({ ...newQuestion, question_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Opción Múltiple</SelectItem>
                    <SelectItem value="true_false">Verdadero/Falso</SelectItem>
                    <SelectItem value="multiple_select">Selección Múltiple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Puntos</Label>
                <Input
                  type="number"
                  min={1}
                  value={newQuestion.points}
                  onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Opciones de Respuesta</Label>
              <div className="space-y-2">
                {newQuestion.options.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={option.is_correct}
                      onCheckedChange={(checked) => {
                        const newOptions = [...newQuestion.options]
                        if (newQuestion.question_type === "multiple_choice") {
                          newOptions.forEach(o => o.is_correct = false)
                        }
                        newOptions[index].is_correct = checked as boolean
                        setNewQuestion({ ...newQuestion, options: newOptions })
                      }}
                    />
                    <Input
                      value={option.text}
                      onChange={(e) => {
                        const newOptions = [...newQuestion.options]
                        newOptions[index].text = e.target.value
                        setNewQuestion({ ...newQuestion, options: newOptions })
                      }}
                      placeholder={`Opción ${index + 1}`}
                      className="flex-1"
                    />
                    {option.is_correct && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Marca la(s) respuesta(s) correcta(s)</p>
            </div>
            <div className="space-y-2">
              <Label>Explicación (opcional)</Label>
              <Textarea
                value={newQuestion.explanation}
                onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                placeholder="Explicación de la respuesta correcta..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuestionDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveQuestion} disabled={!newQuestion.question_text || !newQuestion.options.some(o => o.is_correct && o.text)}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enroll Staff Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Inscribir Empleados a Curso</DialogTitle>
            <DialogDescription>Selecciona el curso y los empleados a inscribir</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Curso *</Label>
              <Select value={enrollCourseId} onValueChange={setEnrollCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.filter(c => c.is_active).map((course) => (
                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Empleados</Label>
              <ScrollArea className="h-64 border rounded-md p-4">
                <div className="space-y-2">
                  {staff.map((member) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedStaffIds.includes(member.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStaffIds([...selectedStaffIds, member.id])
                          } else {
                            setSelectedStaffIds(selectedStaffIds.filter(id => id !== member.id))
                          }
                        }}
                      />
                      <div>
                        <p className="font-medium">{member.first_name} {member.last_name}</p>
                        <p className="text-sm text-muted-foreground">{member.position || member.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-sm text-muted-foreground">{selectedStaffIds.length} seleccionados</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnrollDialog(false)}>Cancelar</Button>
            <Button onClick={handleEnrollStaff} disabled={!enrollCourseId || selectedStaffIds.length === 0}>
              Inscribir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
