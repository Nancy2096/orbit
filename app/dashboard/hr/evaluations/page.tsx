"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Plus,
  Search,
  MoreHorizontal,
  FileText,
  Users,
  UserPlus,
  Target,
  Brain,
  Heart,
  Stethoscope,
  Shield,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  Pencil,
  Copy,
  Trash2,
Play,
  Download,
  Zap,
  Code,
  Award,
  Loader2,
  Star,
  GraduationCap,
  ArrowUp,
  ArrowDown,
  Minus,
  MessageSquare,
  DollarSign,
  CheckCircle,
  Filter,
  Calendar,
  Lightbulb,
  ThermometerSun,
  Grid3X3,
  Radar,
  FileBarChart,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  ClipboardList,
  BookOpen,
  Settings,
  Layers,
  X,
  RotateCcw,
  RefreshCw,
  Send,
  Link2,
  Mail,
} from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Radar as RechartsRadar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
} from "recharts"
import { createClient } from "@/lib/supabase/client"

// Types for staff data
interface StaffMember {
  id: string
  first_name: string
  last_name: string
  email: string
  position: string
  department: string
  hire_date: string
  is_active: boolean
  photo_url: string | null
  agency: {
    id: string
    name: string
  } | null
  department_rel: {
    id: string
    name: string
  } | null
  position_rel: {
    id: string
    name: string
  } | null
}

// Mock data for evaluations
const mockEvaluations = [
  {
    id: "eval-1",
    name: "Evaluación Psicométrica - Desarrollador Sr",
    type: "selection",
    category: "psychometric",
    status: "active",
    applicants: 12,
    completed: 8,
    avgScore: 78,
    createdAt: "2024-01-15",
    dueDate: "2024-02-15",
  },
  {
    id: "eval-2",
    name: "Evaluación 360° - Q1 2024",
    type: "permanence",
    category: "360",
    status: "active",
    applicants: 45,
    completed: 32,
    avgScore: 82,
    createdAt: "2024-01-01",
    dueDate: "2024-01-31",
  },
  {
    id: "eval-3",
    name: "Test Técnico - Frontend",
    type: "selection",
    category: "technical",
    status: "completed",
    applicants: 25,
    completed: 25,
    avgScore: 71,
    createdAt: "2024-01-10",
    dueDate: "2024-01-20",
  },
  {
    id: "eval-4",
    name: "Clima Laboral 2024",
    type: "permanence",
    category: "climate",
    status: "draft",
    applicants: 0,
    completed: 0,
    avgScore: 0,
    createdAt: "2024-01-18",
    dueDate: "2024-02-28",
  },
  {
    id: "eval-5",
    name: "Evaluación por Objetivos - Marketing",
    type: "permanence",
    category: "kpi",
    status: "active",
    applicants: 8,
    completed: 5,
    avgScore: 85,
    createdAt: "2024-01-05",
    dueDate: "2024-01-25",
  },
]

const mockCandidates = [
  {
    id: "cand-1",
    name: "María García López",
    email: "maria.garcia@email.com",
    position: "Desarrollador Senior",
    evaluations: [
      { type: "psychometric", score: 85, status: "completed" },
      { type: "personality", score: 78, status: "completed" },
      { type: "technical", score: 92, status: "completed" },
      { type: "medical", score: null, status: "pending" },
    ],
    overallScore: 85,
    recommendation: "highly_recommended",
    appliedAt: "2024-01-10",
  },
  {
    id: "cand-2",
    name: "Carlos Rodríguez",
    email: "carlos.rodriguez@email.com",
    position: "Diseñador UX",
    evaluations: [
      { type: "psychometric", score: 72, status: "completed" },
      { type: "personality", score: 88, status: "completed" },
      { type: "technical", score: 76, status: "completed" },
      { type: "medical", score: 95, status: "completed" },
    ],
    overallScore: 83,
    recommendation: "recommended",
    appliedAt: "2024-01-12",
  },
  {
    id: "cand-3",
    name: "Ana Martínez",
    email: "ana.martinez@email.com",
    position: "Project Manager",
    evaluations: [
      { type: "psychometric", score: 68, status: "completed" },
      { type: "personality", score: 71, status: "completed" },
      { type: "technical", score: null, status: "in_progress" },
      { type: "medical", score: null, status: "pending" },
    ],
    overallScore: 70,
    recommendation: "needs_review",
    appliedAt: "2024-01-14",
  },
]

const mockCollaborators = [
  {
    id: "col-1",
    name: "Roberto Sánchez",
    position: "Director de Tecnología",
    department: "Tecnología",
    lastEvaluation: "2024-01-15",
    evaluations: {
      "360": { score: 88, trend: "up" },
      kpi: { score: 92, trend: "up" },
      competencies: { score: 85, trend: "stable" },
      potential: "high_performer",
    },
    nineBox: { performance: 3, potential: 3 },
  },
  {
    id: "col-2",
    name: "Laura Pérez",
    position: "Gerente de Marketing",
    department: "Marketing",
    lastEvaluation: "2024-01-10",
    evaluations: {
      "360": { score: 82, trend: "stable" },
      kpi: { score: 78, trend: "down" },
      competencies: { score: 80, trend: "up" },
      potential: "key_player",
    },
    nineBox: { performance: 2, potential: 3 },
  },
  {
    id: "col-3",
    name: "Miguel Torres",
    position: "Desarrollador Full Stack",
    department: "Tecnología",
    lastEvaluation: "2024-01-08",
    evaluations: {
      "360": { score: 75, trend: "up" },
      kpi: { score: 85, trend: "up" },
      competencies: { score: 78, trend: "up" },
      potential: "rising_star",
    },
    nineBox: { performance: 2, potential: 2 },
  },
]

const competenciesData = [
  { subject: "Liderazgo", A: 85, B: 78 },
  { subject: "Comunicación", A: 90, B: 82 },
  { subject: "Trabajo en equipo", A: 88, B: 85 },
  { subject: "Resolución de problemas", A: 82, B: 80 },
  { subject: "Adaptabilidad", A: 78, B: 75 },
  { subject: "Orientación a resultados", A: 92, B: 88 },
]

const climateData = [
  { department: "Tecnología", satisfaction: 85, engagement: 82, culture: 88 },
  { department: "Marketing", satisfaction: 78, engagement: 75, culture: 80 },
  { department: "Ventas", satisfaction: 72, engagement: 78, culture: 75 },
  { department: "RRHH", satisfaction: 90, engagement: 88, culture: 92 },
  { department: "Finanzas", satisfaction: 80, engagement: 76, culture: 82 },
]

const evaluationTemplates = [
  { 
    id: "tpl-1", 
    name: "Psicométrico Estándar", 
    category: "psychometric",
    scope: "selection" as const,
    questions: 50, 
    time: 45,
    description: "Evaluación psicométrica completa para medir aptitudes cognitivas, razonamiento y capacidad de resolución de problemas.",
    sampleQuestions: [
      // Razonamiento Numérico (10 preguntas)
      { type: "multiple", question: "¿Cuál es el siguiente número en la secuencia: 2, 6, 12, 20, ...?", options: ["28", "30", "32", "36"] },
      { type: "multiple", question: "Si 3x + 7 = 22, ¿cuál es el valor de x?", options: ["3", "5", "7", "15"] },
      { type: "multiple", question: "¿Cuál es el 20% de 450?", options: ["45", "90", "80", "100"] },
      { type: "multiple", question: "Complete la serie: 1, 4, 9, 16, 25, ...", options: ["30", "36", "49", "64"] },
      { type: "multiple", question: "Si un producto cuesta $80 con 25% de descuento, ¿cuál era el precio original?", options: ["$100", "$106.67", "$96", "$120"] },
      { type: "multiple", question: "¿Cuál es la raíz cuadrada de 144?", options: ["11", "12", "13", "14"] },
      { type: "multiple", question: "Si 5 trabajadores terminan un trabajo en 6 días, ¿cuántos días tomarán 3 trabajadores?", options: ["8", "10", "12", "15"] },
      { type: "multiple", question: "¿Qué porcentaje es 45 de 180?", options: ["20%", "25%", "30%", "35%"] },
      { type: "multiple", question: "Complete: 2, 3, 5, 7, 11, 13, ...", options: ["15", "17", "19", "21"] },
      { type: "multiple", question: "Si A = 2B y B = 3C, entonces A = ?C", options: ["5C", "6C", "8C", "9C"] },
      // Razonamiento Verbal (10 preguntas)
      { type: "multiple", question: "Si LIBRO es a LECTOR como MÚSICA es a:", options: ["Instrumento", "Oyente", "Compositor", "Nota"] },
      { type: "multiple", question: "ALTO es a BAJO como RÁPIDO es a:", options: ["Veloz", "Lento", "Correr", "Caminar"] },
      { type: "multiple", question: "¿Cuál palabra NO pertenece al grupo? Mesa, Silla, Lámpara, Perro", options: ["Mesa", "Silla", "Lámpara", "Perro"] },
      { type: "multiple", question: "MÉDICO es a HOSPITAL como MAESTRO es a:", options: ["Estudiante", "Escuela", "Libro", "Clase"] },
      { type: "multiple", question: "Seleccione el sinónimo de EFÍMERO:", options: ["Eterno", "Pasajero", "Sólido", "Importante"] },
      { type: "multiple", question: "AGUA es a SED como COMIDA es a:", options: ["Cocina", "Hambre", "Plato", "Comer"] },
      { type: "multiple", question: "¿Cuál es el antónimo de BENÉVOLO?", options: ["Generoso", "Malévolo", "Amable", "Cordial"] },
      { type: "multiple", question: "PINTOR es a PINCEL como ESCRITOR es a:", options: ["Libro", "Pluma", "Papel", "Tinta"] },
      { type: "multiple", question: "Complete la analogía: NOCHE es a OSCURIDAD como DÍA es a:", options: ["Sol", "Luz", "Calor", "Mañana"] },
      { type: "multiple", question: "¿Qué palabra completa la serie? Enero, Marzo, Mayo, ...", options: ["Junio", "Julio", "Agosto", "Septiembre"] },
      // Razonamiento Abstracto (10 preguntas)
      { type: "multiple", question: "En una secuencia de figuras, si el patrón alterna entre círculo y cuadrado, ¿qué sigue después de cuadrado?", options: ["Triángulo", "Círculo", "Cuadrado", "Rectángulo"] },
      { type: "multiple", question: "Si en una matriz 3x3 los números aumentan en diagonal, ¿qué valor va en la esquina inferior derecha si la superior izquierda es 1?", options: ["5", "7", "9", "11"] },
      { type: "multiple", question: "¿Cuántos triángulos hay en una estrella de David?", options: ["2", "4", "6", "8"] },
      { type: "multiple", question: "Si se dobla un papel por la mitad 3 veces, ¿cuántas secciones tendrá al desdoblarlo?", options: ["4", "6", "8", "16"] },
      { type: "multiple", question: "En un cubo, ¿cuántas aristas hay?", options: ["6", "8", "10", "12"] },
      { type: "multiple", question: "Si un patrón de colores es Rojo, Azul, Verde, Rojo, Azul, Verde, ¿cuál es el color 10?", options: ["Rojo", "Azul", "Verde", "Amarillo"] },
      { type: "multiple", question: "¿Cuántas caras tiene un dodecaedro?", options: ["8", "10", "12", "20"] },
      { type: "multiple", question: "Si se rota una figura 90° tres veces, ¿cuántos grados ha rotado en total?", options: ["180°", "270°", "360°", "90°"] },
      { type: "multiple", question: "En una secuencia donde cada figura tiene un lado más que la anterior (triángulo, cuadrado, pentágono), ¿cuántos lados tiene la figura 6?", options: ["6", "7", "8", "9"] },
      { type: "multiple", question: "Si en un patrón los elementos se duplican cada paso (1, 2, 4, 8), ¿cuál es el siguiente?", options: ["10", "12", "16", "32"] },
      // Personalidad y Comportamiento (20 preguntas)
      { type: "scale", question: "Me considero una persona organizada", scale: "1-5" },
      { type: "scale", question: "Prefiero trabajar en equipo que de forma individual", scale: "1-5" },
      { type: "scale", question: "Me adapto fácilmente a los cambios", scale: "1-5" },
      { type: "scale", question: "Mantengo la calma bajo presión", scale: "1-5" },
      { type: "scale", question: "Me gusta asumir roles de liderazgo", scale: "1-5" },
      { type: "scale", question: "Soy puntual en mis compromisos", scale: "1-5" },
      { type: "scale", question: "Busco soluciones creativas a los problemas", scale: "1-5" },
      { type: "scale", question: "Me comunico de manera clara y efectiva", scale: "1-5" },
      { type: "scale", question: "Acepto críticas constructivas positivamente", scale: "1-5" },
      { type: "scale", question: "Establezco metas claras y trabajo para alcanzarlas", scale: "1-5" },
      { type: "scale", question: "Manejo bien múltiples tareas simultáneamente", scale: "1-5" },
      { type: "scale", question: "Busco aprender cosas nuevas constantemente", scale: "1-5" },
      { type: "scale", question: "Resuelvo conflictos de manera diplomática", scale: "1-5" },
      { type: "scale", question: "Me siento cómodo hablando en público", scale: "1-5" },
      { type: "scale", question: "Cumplo con los plazos establecidos", scale: "1-5" },
      { type: "scale", question: "Ayudo a mis compañeros cuando lo necesitan", scale: "1-5" },
      { type: "scale", question: "Tomo la iniciativa sin esperar instrucciones", scale: "1-5" },
      { type: "scale", question: "Me motivo fácilmente ante nuevos retos", scale: "1-5" },
      { type: "scale", question: "Presto atención a los detalles", scale: "1-5" },
      { type: "scale", question: "Mantengo una actitud positiva ante las dificultades", scale: "1-5" },
    ]
  },
  { 
    id: "tpl-2", 
    name: "Test de Personalidad DISC", 
    category: "personality",
    scope: "selection" as const,
    questions: 24, 
    time: 20,
    description: "Evaluación de personalidad basada en el modelo DISC para identificar estilos de comportamiento y comunicación.",
    sampleQuestions: [
      // Dominancia (6 preguntas)
      { type: "scale", question: "Me siento cómodo tomando decisiones rápidas", scale: "1-5" },
      { type: "scale", question: "Prefiero liderar que seguir instrucciones", scale: "1-5" },
      { type: "scale", question: "Me gusta enfrentar desafíos difíciles", scale: "1-5" },
      { type: "scale", question: "Soy directo al comunicar mis opiniones", scale: "1-5" },
      { type: "scale", question: "Me enfoco en resultados más que en procesos", scale: "1-5" },
      { type: "scale", question: "Tomo riesgos calculados para lograr mis objetivos", scale: "1-5" },
      // Influencia (6 preguntas)
      { type: "scale", question: "Disfruto conocer personas nuevas", scale: "1-5" },
      { type: "scale", question: "Me resulta fácil persuadir a otros", scale: "1-5" },
      { type: "scale", question: "Soy optimista sobre el futuro", scale: "1-5" },
      { type: "scale", question: "Me gusta ser el centro de atención", scale: "1-5" },
      { type: "scale", question: "Prefiero ambientes de trabajo colaborativos", scale: "1-5" },
      { type: "scale", question: "Expreso mis emociones abiertamente", scale: "1-5" },
      // Estabilidad (6 preguntas)
      { type: "scale", question: "Prefiero trabajar en equipo que solo", scale: "1-5" },
      { type: "scale", question: "Me gusta tener rutinas establecidas", scale: "1-5" },
      { type: "scale", question: "Soy paciente con los demás", scale: "1-5" },
      { type: "scale", question: "Valoro la lealtad en las relaciones", scale: "1-5" },
      { type: "scale", question: "Prefiero la estabilidad sobre el cambio", scale: "1-5" },
      { type: "scale", question: "Escucho antes de dar mi opinión", scale: "1-5" },
      // Cumplimiento (6 preguntas)
      { type: "scale", question: "Sigo las reglas y procedimientos establecidos", scale: "1-5" },
      { type: "scale", question: "Presto mucha atención a los detalles", scale: "1-5" },
      { type: "scale", question: "Prefiero analizar antes de actuar", scale: "1-5" },
      { type: "scale", question: "Me esfuerzo por hacer las cosas correctamente", scale: "1-5" },
      { type: "scale", question: "Soy sistemático en mi trabajo", scale: "1-5" },
      { type: "multiple", question: "En situaciones de conflicto, yo generalmente:", options: ["Confronto directamente", "Busco mediación", "Evito el conflicto", "Analizo antes de actuar"] },
    ]
  },
  { 
    id: "tpl-3", 
    name: "Evaluación Técnica - Dev", 
    category: "technical",
    scope: "selection" as const,
    questions: 30, 
    time: 60,
    description: "Evaluación de habilidades técnicas para desarrolladores incluyendo lógica de programación, algoritmos y mejores prácticas.",
    sampleQuestions: [
      // Algoritmos y Estructuras de Datos (10 preguntas)
      { type: "multiple", question: "¿Cuál es la complejidad temporal de una búsqueda binaria?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"] },
      { type: "multiple", question: "¿Qué estructura de datos usa LIFO (Last In First Out)?", options: ["Cola", "Pila", "Lista enlazada", "Árbol"] },
      { type: "multiple", question: "¿Cuál es la complejidad temporal del algoritmo QuickSort en el caso promedio?", options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"] },
      { type: "multiple", question: "¿Qué estructura de datos es más eficiente para buscar elementos?", options: ["Array", "Lista enlazada", "Hash Table", "Cola"] },
      { type: "multiple", question: "¿Cuál es la diferencia entre BFS y DFS?", options: ["BFS usa pila, DFS usa cola", "BFS usa cola, DFS usa pila", "Ambos usan pilas", "Ambos usan colas"] },
      { type: "multiple", question: "¿Cuántos nodos tiene un árbol binario completo de altura 3?", options: ["7", "8", "15", "16"] },
      { type: "multiple", question: "¿Qué algoritmo de ordenamiento es estable?", options: ["QuickSort", "HeapSort", "MergeSort", "SelectionSort"] },
      { type: "multiple", question: "¿Cuál es la complejidad de insertar al inicio de un ArrayList?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"] },
      { type: "multiple", question: "¿Qué tipo de recorrido de árbol visita: izquierda, raíz, derecha?", options: ["Preorden", "Inorden", "Postorden", "Por niveles"] },
      { type: "multiple", question: "¿Cuál es el mejor caso de complejidad para Bubble Sort?", options: ["O(1)", "O(n)", "O(n log n)", "O(n²)"] },
      // Programación y Código (10 preguntas)
      { type: "code", question: "Escribe una función que invierta una cadena de texto", language: "javascript" },
      { type: "code", question: "Implementa una función que determine si un número es primo", language: "javascript" },
      { type: "code", question: "Escribe una función que encuentre el elemento más frecuente en un array", language: "javascript" },
      { type: "code", question: "Implementa una función para calcular el factorial de un número", language: "javascript" },
      { type: "code", question: "Escribe una función que elimine duplicados de un array", language: "javascript" },
      { type: "code", question: "Implementa una función que verifique si una cadena es palíndromo", language: "javascript" },
      { type: "code", question: "Escribe una función para encontrar el segundo número más grande en un array", language: "javascript" },
      { type: "code", question: "Implementa una función que cuente las vocales en una cadena", language: "javascript" },
      { type: "code", question: "Escribe una función FizzBuzz para números del 1 al n", language: "javascript" },
      { type: "code", question: "Implementa una función que aplane un array multidimensional", language: "javascript" },
      // Patrones y Mejores Prácticas (10 preguntas)
      { type: "multiple", question: "¿Qué patrón de diseño es más apropiado para crear objetos sin especificar la clase exacta?", options: ["Singleton", "Factory", "Observer", "Decorator"] },
      { type: "multiple", question: "¿Qué principio SOLID indica que una clase debe tener una sola razón para cambiar?", options: ["Open/Closed", "Liskov Substitution", "Single Responsibility", "Interface Segregation"] },
      { type: "multiple", question: "¿Qué patrón se usa para notificar cambios a múltiples objetos?", options: ["Factory", "Singleton", "Observer", "Strategy"] },
      { type: "multiple", question: "¿Qué es la inyección de dependencias?", options: ["Un tipo de herencia", "Pasar dependencias externamente", "Un patrón de UI", "Un tipo de testing"] },
      { type: "multiple", question: "¿Qué significa DRY en programación?", options: ["Debug Run Yield", "Don't Repeat Yourself", "Data Ready Yet", "Dynamic Resource Yielding"] },
      { type: "multiple", question: "¿Cuál NO es un principio de REST?", options: ["Stateless", "Cacheable", "Stateful", "Client-Server"] },
      { type: "multiple", question: "¿Qué patrón permite agregar funcionalidad a un objeto sin modificar su estructura?", options: ["Adapter", "Decorator", "Facade", "Proxy"] },
      { type: "multiple", question: "¿Qué es un code smell?", options: ["Error de compilación", "Bug en producción", "Indicador de mal diseño", "Problema de seguridad"] },
      { type: "multiple", question: "¿Qué tipo de testing verifica la integración entre componentes?", options: ["Unit Testing", "Integration Testing", "E2E Testing", "Stress Testing"] },
      { type: "multiple", question: "¿Qué patrón asegura que solo exista una instancia de una clase?", options: ["Factory", "Builder", "Singleton", "Prototype"] },
    ]
  },
  { 
    id: "tpl-4", 
    name: "Evaluación 360° Completa", 
    category: "360",
    scope: "permanence" as const,
    questions: 40, 
    time: 30,
    description: "Evaluación integral de desempe����o con retroalimentación de supervisores, pares, subordinados y autoevaluación.",
    sampleQuestions: [
      // Liderazgo (8 preguntas)
      { type: "scale", question: "Demuestra habilidades efectivas de comunicación", scale: "1-5" },
      { type: "scale", question: "Inspira y motiva al equipo hacia los objetivos", scale: "1-5" },
      { type: "scale", question: "Toma decisiones oportunas y efectivas", scale: "1-5" },
      { type: "scale", question: "Delega responsabilidades de manera apropiada", scale: "1-5" },
      { type: "scale", question: "Proporciona dirección clara y expectativas", scale: "1-5" },
      { type: "scale", question: "Reconoce y celebra los logros del equipo", scale: "1-5" },
      { type: "scale", question: "Maneja conflictos de manera constructiva", scale: "1-5" },
      { type: "open", question: "Describe una situación donde esta persona demostró liderazgo excepcional" },
      // Trabajo en Equipo (8 preguntas)
      { type: "scale", question: "Colabora efectivamente con el equipo", scale: "1-5" },
      { type: "scale", question: "Comparte información y conocimientos con otros", scale: "1-5" },
      { type: "scale", question: "Apoya a los compañeros cuando lo necesitan", scale: "1-5" },
      { type: "scale", question: "Contribuye positivamente al ambiente de trabajo", scale: "1-5" },
      { type: "scale", question: "Respeta las opiniones y perspectivas de otros", scale: "1-5" },
      { type: "scale", question: "Participa activamente en reuniones de equipo", scale: "1-5" },
      { type: "scale", question: "Construye relaciones de confianza con colegas", scale: "1-5" },
      { type: "open", question: "¿Cómo contribuye esta persona al trabajo en equipo?" },
      // Comunicación (8 preguntas)
      { type: "scale", question: "Se expresa de manera clara y concisa", scale: "1-5" },
      { type: "scale", question: "Escucha activamente a los demás", scale: "1-5" },
      { type: "scale", question: "Proporciona retroalimentación constructiva", scale: "1-5" },
      { type: "scale", question: "Adapta su comunicación seg��n la audiencia", scale: "1-5" },
      { type: "scale", question: "Mantiene informados a los stakeholders relevantes", scale: "1-5" },
      { type: "scale", question: "Maneja conversaciones difíciles con profesionalismo", scale: "1-5" },
      { type: "scale", question: "Presenta ideas de manera convincente", scale: "1-5" },
      { type: "open", question: "¿Cómo podría mejorar sus habilidades de comunicación?" },
      // Resultados y Desempeño (8 preguntas)
      { type: "scale", question: "Cumple consistentemente con los objetivos establecidos", scale: "1-5" },
      { type: "scale", question: "Demuestra compromiso con la calidad del trabajo", scale: "1-5" },
      { type: "scale", question: "Gestiona eficientemente su tiempo y prioridades", scale: "1-5" },
      { type: "scale", question: "Busca proactivamente mejorar procesos", scale: "1-5" },
      { type: "scale", question: "Asume responsabilidad por sus resultados", scale: "1-5" },
      { type: "scale", question: "Supera expectativas cuando es posible", scale: "1-5" },
      { type: "scale", question: "Maneja múltiples proyectos efectivamente", scale: "1-5" },
      { type: "open", question: "Describe el logro más significativo de esta persona este período" },
      // Desarrollo Profesional (8 preguntas)
      { type: "scale", question: "Demuestra disposición para aprender y crecer", scale: "1-5" },
      { type: "scale", question: "Busca activamente retroalimentación", scale: "1-5" },
      { type: "scale", question: "Aplica nuevos conocimientos en su trabajo", scale: "1-5" },
      { type: "scale", question: "Se adapta a cambios y nuevas situaciones", scale: "1-5" },
      { type: "scale", question: "Demuestra pensamiento estratégico", scale: "1-5" },
      { type: "scale", question: "Mantiene actualizados sus conocimientos técnicos", scale: "1-5" },
      { type: "scale", question: "Contribuye al desarrollo de otros", scale: "1-5" },
      { type: "open", question: "¿Qué áreas de desarrollo recomendaría para esta persona?" },
    ]
  },
  { 
    id: "tpl-5", 
    name: "Clima Laboral Anual", 
    category: "climate",
    scope: "permanence" as const,
    questions: 35, 
    time: 15,
    description: "Encuesta de clima organizacional para medir satisfacción, compromiso y ambiente laboral.",
    sampleQuestions: [
      // Satisfacción General (7 preguntas)
      { type: "scale", question: "Me siento valorado en mi trabajo", scale: "1-5" },
      { type: "scale", question: "Estoy satisfecho con mi rol actual", scale: "1-5" },
      { type: "scale", question: "Recomendaría esta empresa como lugar de trabajo", scale: "1-5" },
      { type: "scale", question: "Me siento orgulloso de trabajar aquí", scale: "1-5" },
      { type: "scale", question: "Veo un futuro a largo plazo en esta organización", scale: "1-5" },
      { type: "scale", question: "Mi trabajo me da un sentido de logro", scale: "1-5" },
      { type: "scale", question: "Me siento motivado para dar lo mejor de mí", scale: "1-5" },
      // Ambiente de Trabajo (7 preguntas)
      { type: "scale", question: "Tengo las herramientas necesarias para hacer mi trabajo", scale: "1-5" },
      { type: "scale", question: "El ambiente físico de trabajo es adecuado", scale: "1-5" },
      { type: "scale", question: "Existe un buen equilibrio vida-trabajo", scale: "1-5" },
      { type: "scale", question: "Me siento seguro expresando mis opiniones", scale: "1-5" },
      { type: "scale", question: "El ambiente de trabajo es respetuoso e inclusivo", scale: "1-5" },
      { type: "scale", question: "Hay buena colaboración entre departamentos", scale: "1-5" },
      { type: "scale", question: "Los conflictos se manejan de manera justa", scale: "1-5" },
      // Liderazgo y Gestión (7 preguntas)
      { type: "scale", question: "Mi supervisor me brinda apoyo cuando lo necesito", scale: "1-5" },
      { type: "scale", question: "Recibo retroalimentación útil sobre mi desempeño", scale: "1-5" },
      { type: "scale", question: "La comunicación de la dirección es clara y transparente", scale: "1-5" },
      { type: "scale", question: "Confío en las decisiones de la alta dirección", scale: "1-5" },
      { type: "scale", question: "Mi supervisor reconoce mi buen trabajo", scale: "1-5" },
      { type: "scale", question: "Los líderes de la organización son accesibles", scale: "1-5" },
      { type: "scale", question: "Entiendo cómo mi trabajo contribuye a los objetivos de la empresa", scale: "1-5" },
      // Desarrollo y Crecimiento (7 preguntas)
      { type: "scale", question: "Tengo oportunidades de desarrollo profesional", scale: "1-5" },
      { type: "scale", question: "La empresa invierte en mi capacitación", scale: "1-5" },
      { type: "scale", question: "Existen oportunidades claras de promoción", scale: "1-5" },
      { type: "scale", question: "Mi trabajo me permite desarrollar nuevas habilidades", scale: "1-5" },
      { type: "scale", question: "Recibo el entrenamiento necesario para mi rol", scale: "1-5" },
      { type: "scale", question: "Hay un plan de carrera claro para mí", scale: "1-5" },
      { type: "scale", question: "Se fomenta la innovación y nuevas ideas", scale: "1-5" },
      // Compensación y Beneficios (7 preguntas)
      { type: "scale", question: "Mi salario es justo para mi rol y responsabilidades", scale: "1-5" },
      { type: "scale", question: "Los beneficios que recibo son competitivos", scale: "1-5" },
      { type: "scale", question: "Entiendo cómo se determinan los aumentos salariales", scale: "1-5" },
      { type: "scale", question: "El proceso de evaluación de desempeño es justo", scale: "1-5" },
      { type: "scale", question: "Existen programas de reconocimiento efectivos", scale: "1-5" },
      { type: "scale", question: "Los beneficios de salud son adecuados", scale: "1-5" },
      { type: "open", question: "¿Qué mejorarías de tu ambiente de trabajo?" },
    ]
  },
  { 
    id: "tpl-6", 
    name: "Evaluación por Competencias", 
    category: "competencies",
    scope: "permanence" as const,
    questions: 25, 
    time: 25,
    description: "Evaluación basada en competencias organizacionales clave para medir habilidades y comportamientos esperados.",
    sampleQuestions: [
      // Iniciativa y Proactividad (5 preguntas)
      { type: "scale", question: "Demuestra iniciativa y proactividad", scale: "1-5" },
      { type: "scale", question: "Identifica oportunidades de mejora sin que se le solicite", scale: "1-5" },
      { type: "scale", question: "Propone soluciones innovadoras a problemas", scale: "1-5" },
      { type: "scale", question: "Toma acción ante situaciones ambiguas", scale: "1-5" },
      { type: "behavioral", question: "Describe una situación donde tomaste la iniciativa para mejorar un proceso o resolver un problema" },
      // Resolución de Problemas (5 preguntas)
      { type: "scale", question: "Analiza problemas de manera sistemática", scale: "1-5" },
      { type: "scale", question: "Considera múltiples alternativas antes de decidir", scale: "1-5" },
      { type: "scale", question: "Busca la causa raíz de los problemas", scale: "1-5" },
      { type: "scale", question: "Implementa soluciones efectivas y duraderas", scale: "1-5" },
      { type: "behavioral", question: "Describe una situación donde tuviste que resolver un problema complejo. ¿Qué hiciste?" },
      // Adaptabilidad (5 preguntas)
      { type: "scale", question: "Se adapta fácilmente a los cambios", scale: "1-5" },
      { type: "scale", question: "Mantiene la efectividad bajo presión", scale: "1-5" },
      { type: "scale", question: "Aprende rápidamente de nuevas situaciones", scale: "1-5" },
      { type: "scale", question: "Acepta positivamente nuevas responsabilidades", scale: "1-5" },
      { type: "behavioral", question: "Describe cómo manejaste un cambio significativo en tu trabajo" },
      // Orientación a Resultados (5 preguntas)
      { type: "scale", question: "Establece metas claras y desafiantes", scale: "1-5" },
      { type: "scale", question: "Persevera ante obstáculos para lograr objetivos", scale: "1-5" },
      { type: "scale", question: "Mide y monitorea su progreso regularmente", scale: "1-5" },
      { type: "scale", question: "Prioriza actividades según su impacto", scale: "1-5" },
      { type: "behavioral", question: "Describe un logro del que te sientas particularmente orgulloso y cómo lo alcanzaste" },
      // Trabajo en Equipo (5 preguntas)
      { type: "scale", question: "Colabora efectivamente con diversos equipos", scale: "1-5" },
      { type: "scale", question: "Comparte conocimientos y recursos generosamente", scale: "1-5" },
      { type: "scale", question: "Valora y aprovecha las fortalezas de otros", scale: "1-5" },
      { type: "scale", question: "Contribuye a un ambiente de equipo positivo", scale: "1-5" },
      { type: "behavioral", question: "Describe cómo contribuiste al éxito de un proyecto de equipo" },
    ]
  },
  {
    id: "tpl-obj-1",
    name: "Definición de Objetivos (OKR)",
    category: "kpi",
    scope: "objectives" as const,
    questions: 8,
    time: 20,
    description: "Plantilla para establecer objetivos y resultados clave (OKR) por colaborador, con metas medibles y plazos definidos.",
    sampleQuestions: [
      { type: "open", question: "¿Cuál es el objetivo principal a lograr en el período?" },
      { type: "open", question: "Resultado clave 1 (medible y con meta numérica)" },
      { type: "open", question: "Resultado clave 2 (medible y con meta numérica)" },
      { type: "open", question: "Resultado clave 3 (medible y con meta numérica)" },
      { type: "open", question: "¿Cómo contribuye este objetivo a las metas del área?" },
      { type: "open", question: "Recursos o apoyo necesarios para lograrlo" },
      { type: "scale", question: "Nivel de prioridad del objetivo", scale: "1-5" },
      { type: "open", question: "Fecha límite y entregables esperados" },
    ]
  },
  {
    id: "tpl-obj-2",
    name: "Seguimiento de Objetivos",
    category: "kpi",
    scope: "objectives" as const,
    questions: 7,
    time: 15,
    description: "Plantilla de seguimiento periódico del avance de objetivos, con calificación de cumplimiento y acciones de mejora.",
    sampleQuestions: [
      { type: "scale", question: "Porcentaje de avance del objetivo", scale: "0-100" },
      { type: "scale", question: "Cumplimiento del resultado clave 1", scale: "1-5" },
      { type: "scale", question: "Cumplimiento del resultado clave 2", scale: "1-5" },
      { type: "scale", question: "Cumplimiento del resultado clave 3", scale: "1-5" },
      { type: "open", question: "Principales logros del período" },
      { type: "open", question: "Obstáculos encontrados y acciones de mejora" },
      { type: "open", question: "Comentarios del evaluador" },
    ]
  },
]

const categoryConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  psychometric: { label: "Psicométrico", icon: <Brain className="h-4 w-4" />, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  personality: { label: "Personalidad", icon: <Heart className="h-4 w-4" />, color: "text-pink-600", bgColor: "bg-pink-100 dark:bg-pink-900/30" },
  technical: { label: "Técnico", icon: <FileText className="h-4 w-4" />, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  medical: { label: "Médico", icon: <Stethoscope className="h-4 w-4" />, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  polygraph: { label: "Polígrafo", icon: <Shield className="h-4 w-4" />, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" },
  "360": { label: "360°", icon: <Users className="h-4 w-4" />, color: "text-indigo-600", bgColor: "bg-indigo-100 dark:bg-indigo-900/30" },
  kpi: { label: "KPIs", icon: <Target className="h-4 w-4" />, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  competencies: { label: "Competencias", icon: <Award className="h-4 w-4" />, color: "text-cyan-600", bgColor: "bg-cyan-100 dark:bg-cyan-900/30" },
  potential: { label: "Potencial", icon: <Lightbulb className="h-4 w-4" />, color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
  climate: { label: "Clima Laboral", icon: <ThermometerSun className="h-4 w-4" />, color: "text-teal-600", bgColor: "bg-teal-100 dark:bg-teal-900/30" },
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  active: { label: "Activa", color: "text-green-700", bgColor: "bg-green-100 dark:bg-green-900/30" },
  completed: { label: "Completada", color: "text-blue-700", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  draft: { label: "Borrador", color: "text-gray-700", bgColor: "bg-gray-100 dark:bg-gray-900/30" },
  paused: { label: "Pausada", color: "text-amber-700", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
}

const recommendationConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  highly_recommended: { label: "Altamente Recomendado", color: "text-green-700", bgColor: "bg-green-100 dark:bg-green-900/30", icon: <CheckCircle2 className="h-4 w-4" /> },
  recommended: { label: "Recomendado", color: "text-blue-700", bgColor: "bg-blue-100 dark:bg-blue-900/30", icon: <CheckCircle2 className="h-4 w-4" /> },
  needs_review: { label: "Requiere Revisión", color: "text-amber-700", bgColor: "bg-amber-100 dark:bg-amber-900/30", icon: <AlertCircle className="h-4 w-4" /> },
  not_recommended: { label: "No Recomendado", color: "text-red-700", bgColor: "bg-red-100 dark:bg-red-900/30", icon: <XCircle className="h-4 w-4" /> },
}

// Nine Box grid labels
const nineBoxLabels = [
  ["Enigma", "Futuro Líder", "Estrella"],
  ["Dilema", "Profesional Clave", "Alto Potencial"],
  ["Bajo Rendimiento", "Especialista", "Alto Rendimiento"],
]

const nineBoxColors = [
  ["bg-amber-200 dark:bg-amber-800", "bg-blue-200 dark:bg-blue-800", "bg-green-200 dark:bg-green-800"],
  ["bg-orange-200 dark:bg-orange-800", "bg-cyan-200 dark:bg-cyan-800", "bg-teal-200 dark:bg-teal-800"],
  ["bg-red-200 dark:bg-red-800", "bg-gray-200 dark:bg-gray-700", "bg-emerald-200 dark:bg-emerald-800"],
]

export default function EvaluationsPage() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showNewEvaluationDialog, setShowNewEvaluationDialog] = useState(false)
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showEditTemplateDialog, setShowEditTemplateDialog] = useState(false)
  const [showCreateTemplateDialog, setShowCreateTemplateDialog] = useState(false)
  const [showNewCandidateDialog, setShowNewCandidateDialog] = useState(false)
  const [showStartPermanenceEvalDialog, setShowStartPermanenceEvalDialog] = useState(false)
  const [showStartCandidateEvalDialog, setShowStartCandidateEvalDialog] = useState(false)
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [staffSearchTerm, setStaffSearchTerm] = useState("")
  const [candidatesList, setCandidatesList] = useState<Array<{
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
    position_applied: string | null
    status: string
    created_at: string
  }>>([])
  const [loadingCandidates, setLoadingCandidates] = useState(true)
  const [candidateSearchTerm, setCandidateSearchTerm] = useState("")
  const [savingCandidate, setSavingCandidate] = useState(false)
  const [candidateEvaluations, setCandidateEvaluations] = useState<Array<{
    id: string
    candidate_id: string
    evaluation_type: string
    status: string
    score: number | null
    started_at: string | null
    completed_at: string | null
  }>>([])
  const [staffEvaluations, setStaffEvaluations] = useState<Array<{
    id: string
    staff_id: string
    evaluation_type: string
    status: string
    score: number | null
    started_at: string | null
    completed_at: string | null
  }>>([])
  const [newCandidateForm, setNewCandidateForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    position: "",
  })
  const [candidateEvalForm, setCandidateEvalForm] = useState({
    candidateId: "",
    templateId: "",
  })
  const [permanenceEvalForm, setPermanenceEvalForm] = useState({
    collaboratorId: "",
    evaluationType: "360",
  })
  const [showEvalMethodDialog, setShowEvalMethodDialog] = useState(false)
  const [evalMethodData, setEvalMethodData] = useState<{
    candidateId: string
    evalType: string
    candidateName: string
  } | null>(null)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [showApplyEvalDialog, setShowApplyEvalDialog] = useState(false)
  const [applyEvalQuestions, setApplyEvalQuestions] = useState<Array<{
    id: string
    question_text: string
    question_order: number
    question_type: string
    options: Array<{ value: number; label: string }>
  }>>([])
  const [applyEvalAnswers, setApplyEvalAnswers] = useState<Record<string, number>>({})
  const [applyEvalCurrentQuestion, setApplyEvalCurrentQuestion] = useState(0)
  const [applyEvalCandidateEvalId, setApplyEvalCandidateEvalId] = useState<string | null>(null)
  
  // Staff Evaluation States
  const [showStaffEvalMethodDialog, setShowStaffEvalMethodDialog] = useState(false)
  const [staffEvalMethodData, setStaffEvalMethodData] = useState<{
    staffId: string
    evalType: string
    staffName: string
    staff: StaffMember
  } | null>(null)
  const [staffEvalTemplate, setStaffEvalTemplate] = useState<string>("")
  const [staffEvalEvaluators, setStaffEvalEvaluators] = useState<Array<{
    type: "self" | "supervisor" | "peer" | "subordinate"
    name: string
    email: string
  }>>([])
  const [staffEvalGeneratedLinks, setStaffEvalGeneratedLinks] = useState<Array<{
    type: string
    name: string
    link: string
  }>>([])
  const [showStaffApplyEvalDialog, setShowStaffApplyEvalDialog] = useState(false)
  const [staffApplyEvalData, setStaffApplyEvalData] = useState<{
    template: typeof evaluationTemplates[0]
    staffEvalId: string
    assignmentId: string
  } | null>(null)
  const [staffApplyEvalAnswers, setStaffApplyEvalAnswers] = useState<Record<number, number>>({})
  const [staffApplyEvalCurrentQuestion, setStaffApplyEvalCurrentQuestion] = useState(0)
  
  // Estado para reiniciar/reenviar evaluaciones
  const [showResendEvalDialog, setShowResendEvalDialog] = useState(false)
  const [resendEvalData, setResendEvalData] = useState<{
    id: string
    type: "candidate" | "staff"
    evalType: string
    personName: string
    personEmail: string
    currentLink: string
    status: string
  } | null>(null)
  const [resendingEval, setResendingEval] = useState(false)
  
  // Estado para reiniciar evaluación completa (con cambio de evaluador)
  const [showRestartEvalDialog, setShowRestartEvalDialog] = useState(false)
  const [restartEvalData, setRestartEvalData] = useState<{
    id: string
    type: "candidate" | "staff"
    evalType: string
    personName: string
    personEmail: string
    currentEvaluatorId: string | null
    currentEvaluatorName: string | null
  } | null>(null)
  const [restartEvalNewEvaluatorId, setRestartEvalNewEvaluatorId] = useState<string>("")
  const [restartingEval, setRestartingEval] = useState(false)
  const [restartEvalKeepEvaluator, setRestartEvalKeepEvaluator] = useState(true)
  
  const [selectedTemplate, setSelectedTemplate] = useState<typeof evaluationTemplates[0] | null>(null)
  const [templatesList, setTemplatesList] = useState(evaluationTemplates)
  const [templateScopeFilter, setTemplateScopeFilter] = useState<"all" | "selection" | "permanence" | "objectives">("all")
  const [newTemplateForm, setNewTemplateForm] = useState({
    name: "",
    description: "",
    category: "psychometric",
    scope: "selection" as "selection" | "permanence" | "objectives",
    questions: 10,
    time: 15,
    sampleQuestions: [] as Array<{
      type: string;
      question: string;
      options?: string[];
      scale?: string;
      language?: string;
    }>,
  })
const [editTemplateForm, setEditTemplateForm] = useState({
  name: "",
  description: "",
  category: "psychometric",
  scope: "selection" as "selection" | "permanence" | "objectives",
  questions: 0,
  time: 0,
  sampleQuestions: [] as Array<{
  type: string;
  question: string;
  options?: string[];
  scale?: string;
      language?: string;
    }>,
  })

  // Objetivos: estado y formularios
  type ObjectiveFollowUp = { id: string; date: string; progress: number; note: string }
  type Objective = {
    id: string
    title: string
    description: string
    staffId: string
    staffName: string
    period: string
    dueDate: string
    progress: number
    status: "pending" | "in_progress" | "completed" | "at_risk"
    followUps: ObjectiveFollowUp[]
  }
  const [objectives, setObjectives] = useState<Objective[]>([
    {
      id: "obj-1",
      title: "Incrementar retención de clientes",
      description: "Aumentar la tasa de retención de cuentas clave en un 15% durante el período.",
      staffId: "",
      staffName: "Equipo Comercial",
      period: "Q1 2026",
      dueDate: "2026-03-31",
      progress: 45,
      status: "in_progress",
      followUps: [
        { id: "fu-1", date: "2026-02-15", progress: 45, note: "Avance en renovaciones de cuentas prioritarias." },
      ],
    },
  ])
  const [showNewObjectiveDialog, setShowNewObjectiveDialog] = useState(false)
  const [showObjectiveFollowUpDialog, setShowObjectiveFollowUpDialog] = useState(false)
  const [activeObjectiveId, setActiveObjectiveId] = useState<string | null>(null)
  const [newObjectiveForm, setNewObjectiveForm] = useState({
    title: "",
    description: "",
    staffId: "",
    period: "",
    dueDate: "",
  })
  const [followUpForm, setFollowUpForm] = useState({ progress: 0, note: "" })

  const objectiveStatusConfig: Record<Objective["status"], { label: string; className: string }> = {
    pending: { label: "Pendiente", className: "bg-slate-100 text-slate-700 border-slate-200" },
    in_progress: { label: "En progreso", className: "bg-blue-50 text-blue-700 border-blue-200" },
    at_risk: { label: "En riesgo", className: "bg-red-50 text-red-700 border-red-200" },
    completed: { label: "Completado", className: "bg-green-50 text-green-700 border-green-200" },
  }

  const handleCreateObjective = () => {
    if (!newObjectiveForm.title.trim()) {
      alert("Ingresa un título para el objetivo")
      return
    }
    const staff = staffList.find((s) => s.id === newObjectiveForm.staffId)
    const newObj: Objective = {
      id: `obj-${Date.now()}`,
      title: newObjectiveForm.title,
      description: newObjectiveForm.description,
      staffId: newObjectiveForm.staffId,
      staffName: staff ? `${staff.first_name} ${staff.last_name}` : "Sin asignar",
      period: newObjectiveForm.period || "Sin período",
      dueDate: newObjectiveForm.dueDate,
      progress: 0,
      status: "pending",
      followUps: [],
    }
    setObjectives((prev) => [newObj, ...prev])
    setNewObjectiveForm({ title: "", description: "", staffId: "", period: "", dueDate: "" })
    setShowNewObjectiveDialog(false)
  }

  const handleAddFollowUp = () => {
    if (!activeObjectiveId) return
    setObjectives((prev) =>
      prev.map((obj) => {
        if (obj.id !== activeObjectiveId) return obj
        const progress = Math.max(0, Math.min(100, followUpForm.progress))
        return {
          ...obj,
          progress,
          status: progress >= 100 ? "completed" : progress > 0 ? "in_progress" : obj.status,
          followUps: [
            { id: `fu-${Date.now()}`, date: new Date().toISOString().slice(0, 10), progress, note: followUpForm.note },
            ...obj.followUps,
          ],
        }
      })
    )
    setFollowUpForm({ progress: 0, note: "" })
    setActiveObjectiveId(null)
    setShowObjectiveFollowUpDialog(false)
  }

  // Load staff data from Supabase
  useEffect(() => {
    async function loadStaff() {
      setLoadingStaff(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("staff")
          .select(`
            id,
            first_name,
            last_name,
            email,
            position,
            department,
            hire_date,
            is_active,
            photo_url,
            agency:agencies!staff_agency_id_fkey(id, name),
            department_rel:departments!staff_department_id_fkey(id, name),
            position_rel:positions!staff_position_id_fkey(id, name)
          `)
          .eq("is_active", true)
          .order("first_name")
        
        if (error) {
          console.error("Error loading staff:", error)
        } else {
          setStaffList(data as unknown as StaffMember[] || [])
        }

        // Load staff evaluations
        const { data: staffEvalsData, error: staffEvalsError } = await supabase
          .from("staff_evaluations")
          .select("*")
        
        if (staffEvalsError) {
          console.error("Error loading staff evaluations:", staffEvalsError)
        } else {
          setStaffEvaluations(staffEvalsData || [])
        }
      } catch (err) {
        console.error("Error loading staff:", err)
      } finally {
        setLoadingStaff(false)
      }
    }
    loadStaff()
  }, [])

  // Load candidates from Supabase
  useEffect(() => {
    async function loadCandidates() {
      setLoadingCandidates(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("candidates")
          .select("*")
          .order("created_at", { ascending: false })
        
        if (error) {
          console.error("Error loading candidates:", error)
        } else {
          setCandidatesList(data || [])
        }

        // Load candidate evaluations
        const { data: evalsData, error: evalsError } = await supabase
          .from("candidate_evaluations")
          .select("*")
        
        if (evalsError) {
          console.error("Error loading candidate evaluations:", evalsError)
        } else {
          setCandidateEvaluations(evalsData || [])
        }
      } catch (err) {
        console.error("Error loading candidates:", err)
      } finally {
        setLoadingCandidates(false)
      }
    }
    loadCandidates()
  }, [])

  // Filter staff for the permanence section
  const filteredStaff = staffList.filter((staff) => {
    const fullName = `${staff.first_name} ${staff.last_name}`.toLowerCase()
    const searchLower = staffSearchTerm.toLowerCase()
    return (
      fullName.includes(searchLower) ||
      staff.email?.toLowerCase().includes(searchLower) ||
      staff.position?.toLowerCase().includes(searchLower) ||
      staff.department?.toLowerCase().includes(searchLower) ||
      staff.agency?.name?.toLowerCase().includes(searchLower)
    )
  })

  // Filter candidates for the selection section
  const filteredCandidates = candidatesList.filter((candidate) => {
    const fullName = `${candidate.first_name} ${candidate.last_name}`.toLowerCase()
    const searchLower = candidateSearchTerm.toLowerCase()
    return (
      fullName.includes(searchLower) ||
      candidate.email?.toLowerCase().includes(searchLower) ||
      candidate.position_applied?.toLowerCase().includes(searchLower)
    )
  })

  // Save new candidate to database
  const handleSaveCandidate = async () => {
    if (!newCandidateForm.first_name || !newCandidateForm.last_name) {
      alert("Por favor ingresa el nombre completo del candidato")
      return
    }
    
    setSavingCandidate(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("candidates")
        .insert({
          first_name: newCandidateForm.first_name,
          last_name: newCandidateForm.last_name,
          email: newCandidateForm.email || null,
          phone: newCandidateForm.phone || null,
          position_applied: newCandidateForm.position || null,
          status: "pending",
        })
        .select()
        .single()
      
      if (error) {
        console.error("Error saving candidate:", error)
        alert("Error al guardar el candidato: " + error.message)
      } else {
        setCandidatesList(prev => [data, ...prev])
        setNewCandidateForm({ first_name: "", last_name: "", email: "", phone: "", position: "" })
        setShowNewCandidateDialog(false)
      }
    } catch (err) {
      console.error("Error saving candidate:", err)
      alert("Error al guardar el candidato")
    } finally {
      setSavingCandidate(false)
    }
  }

  // Get evaluation status for a candidate
  const getCandidateEvalStatus = (candidateId: string, evalType: string) => {
    const evaluation = candidateEvaluations.find(
      e => e.candidate_id === candidateId && e.evaluation_type === evalType
    )
    return evaluation || null
  }

  // Start a candidate evaluation
  const handleStartCandidateEvaluation = async (candidateId: string, evalType: string) => {
    // Check if evaluation already exists
    const existing = candidateEvaluations.find(
      e => e.candidate_id === candidateId && e.evaluation_type === evalType
    )
    
    if (existing) {
      alert("Esta evaluación ya ha sido iniciada")
      return
    }

    // Get candidate name
    const candidate = candidatesList.find(c => c.id === candidateId)
    const candidateName = candidate ? `${candidate.first_name} ${candidate.last_name}` : "Candidato"

    // Show method selection dialog
    setEvalMethodData({ candidateId, evalType, candidateName })
    setGeneratedLink(null)
    setShowEvalMethodDialog(true)
  }

  // Generate link for candidate to complete evaluation
  const handleGenerateEvalLink = async () => {
    if (!evalMethodData) return

    try {
      const supabase = createClient()
      const { candidateId, evalType } = evalMethodData

      // Create evaluation record
      const { data: evalData, error: evalError } = await supabase
        .from("candidate_evaluations")
        .insert({
          candidate_id: candidateId,
          evaluation_type: evalType,
          status: "in_progress",
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (evalError) {
        console.error("Error creating evaluation:", evalError)
        alert("Error al crear la evaluación: " + evalError.message)
        return
      }

      setCandidateEvaluations(prev => [...prev, evalData])

      // Generate unique token
      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // Token expires in 7 days

      const { error: tokenError } = await supabase
        .from("evaluation_tokens")
        .insert({
          candidate_evaluation_id: evalData.id,
          token: token,
          expires_at: expiresAt.toISOString(),
        })

      if (tokenError) {
        console.error("Error creating token:", tokenError)
        alert("Error al generar el enlace")
        return
      }

      // Update candidate status
      const candidate = candidatesList.find(c => c.id === candidateId)
      if (candidate?.status === "pending") {
        await supabase
          .from("candidates")
          .update({ status: "in_progress" })
          .eq("id", candidateId)
        
        setCandidatesList(prev => prev.map(c => 
          c.id === candidateId ? { ...c, status: "in_progress" } : c
        ))
      }

      // Generate the full URL
      const baseUrl = window.location.origin
      const link = `${baseUrl}/evaluacion/${token}`
      setGeneratedLink(link)
    } catch (err) {
      console.error("Error generating link:", err)
      alert("Error al generar el enlace")
    }
  }

  // Start internal evaluation (recruiter applies it)
  const handleStartInternalEval = async () => {
    if (!evalMethodData) return

    try {
      const supabase = createClient()
      const { candidateId, evalType } = evalMethodData

      // Create evaluation record
      const { data: evalData, error: evalError } = await supabase
        .from("candidate_evaluations")
        .insert({
          candidate_id: candidateId,
          evaluation_type: evalType,
          status: "in_progress",
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (evalError) {
        console.error("Error creating evaluation:", evalError)
        alert("Error al crear la evaluación: " + evalError.message)
        return
      }

      setCandidateEvaluations(prev => [...prev, evalData])
      setApplyEvalCandidateEvalId(evalData.id)

      // Update candidate status
      const candidate = candidatesList.find(c => c.id === candidateId)
      if (candidate?.status === "pending") {
        await supabase
          .from("candidates")
          .update({ status: "in_progress" })
          .eq("id", candidateId)
        
        setCandidatesList(prev => prev.map(c => 
          c.id === candidateId ? { ...c, status: "in_progress" } : c
        ))
      }

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("evaluation_questions")
        .select("*")
        .eq("evaluation_type", evalType)
        .order("question_order", { ascending: true })

      if (questionsError) {
        console.error("Error loading questions:", questionsError)
        alert("Error al cargar las preguntas")
        return
      }

      setApplyEvalQuestions(questionsData || [])
      setApplyEvalAnswers({})
      setApplyEvalCurrentQuestion(0)
      setShowEvalMethodDialog(false)
      setShowApplyEvalDialog(true)
    } catch (err) {
      console.error("Error starting internal evaluation:", err)
      alert("Error al iniciar la evaluación")
    }
  }

  // Submit internal evaluation
  const handleSubmitInternalEval = async () => {
    if (!applyEvalCandidateEvalId || !evalMethodData) return

    try {
      const supabase = createClient()

      // Save responses
      const responses = Object.entries(applyEvalAnswers).map(([questionId, value]) => ({
        candidate_evaluation_id: applyEvalCandidateEvalId,
        question_id: questionId,
        answer_value: value,
      }))

      const { error: responsesError } = await supabase
        .from("evaluation_responses")
        .insert(responses)

      if (responsesError) {
        console.error("Error saving responses:", responsesError)
        alert("Error al guardar las respuestas")
        return
      }

      // Calculate score
      const totalQuestions = applyEvalQuestions.length
      let correctAnswers = 0
      const evalType = evalMethodData.evalType

      if (evalType === "psychometric") {
        const correctAnswerMap: Record<number, number> = { 1: 2, 2: 1, 3: 1, 4: 2, 5: 3 }
        applyEvalQuestions.forEach((q, idx) => {
          if (applyEvalAnswers[q.id] === correctAnswerMap[idx + 1]) correctAnswers++
        })
      } else if (evalType === "technical") {
        const correctAnswerMap: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 1, 5: 1 }
        applyEvalQuestions.forEach((q, idx) => {
          if (applyEvalAnswers[q.id] === correctAnswerMap[idx + 1]) correctAnswers++
        })
      } else {
        const totalValue = Object.values(applyEvalAnswers).reduce((sum, val) => sum + val, 0)
        const maxPossible = evalType === "personality" ? totalQuestions * 5 : totalQuestions
        correctAnswers = Math.round((totalValue / maxPossible) * totalQuestions)
      }

      const score = Math.round((correctAnswers / totalQuestions) * 100)

      // Update evaluation
      const { error: updateError } = await supabase
        .from("candidate_evaluations")
        .update({
          status: "completed",
          score: score,
          completed_at: new Date().toISOString(),
        })
        .eq("id", applyEvalCandidateEvalId)

      if (updateError) {
        console.error("Error updating evaluation:", updateError)
      }

      // Update local state
      setCandidateEvaluations(prev => prev.map(e => 
        e.id === applyEvalCandidateEvalId 
          ? { ...e, status: "completed", score, completed_at: new Date().toISOString() } 
          : e
      ))

      const evalNames: Record<string, string> = {
        psychometric: "Psicométrica",
        personality: "Personalidad",
        technical: "Técnica",
        medical: "Médica"
      }

      alert(`Evaluación ${evalNames[evalType]} completada. Puntaje: ${score}%`)
      setShowApplyEvalDialog(false)
      setEvalMethodData(null)
      setApplyEvalCandidateEvalId(null)
    } catch (err) {
      console.error("Error submitting evaluation:", err)
      alert("Error al enviar la evaluación")
    }
  }

  // Get evaluation status for staff
  const getStaffEvalStatus = (staffId: string, evalType: string) => {
    const evaluation = staffEvaluations.find(
      e => e.staff_id === staffId && e.evaluation_type === evalType
    )
    return evaluation || null
  }

  // Start a staff evaluation
  const handleStartStaffEvaluation = async (staffId: string, evalType: string) => {
    // Check if evaluation already exists
    const existing = staffEvaluations.find(
      e => e.staff_id === staffId && e.evaluation_type === evalType
    )
    
    if (existing) {
      alert("Esta evaluación ya ha sido iniciada")
      return
    }

    // Get staff info
    const staff = staffList.find(s => s.id === staffId)
    if (!staff) return

    const staffName = `${staff.first_name} ${staff.last_name}`

    // Show method selection dialog
    setStaffEvalMethodData({ staffId, evalType, staffName, staff })
    setStaffEvalTemplate("")
    setStaffEvalEvaluators([
      { type: "self", name: staffName, email: staff.email || "" }
    ])
    setStaffEvalGeneratedLinks([])
    setShowStaffEvalMethodDialog(true)
  }

  // Add evaluator to staff evaluation
  const handleAddStaffEvaluator = (type: "supervisor" | "peer" | "subordinate") => {
    setStaffEvalEvaluators(prev => [...prev, { type, name: "", email: "" }])
  }

  // Remove evaluator from staff evaluation  
  const handleRemoveStaffEvaluator = (index: number) => {
    if (staffEvalEvaluators[index].type === "self") return
    setStaffEvalEvaluators(prev => prev.filter((_, i) => i !== index))
  }

  // Generate links for all evaluators
  const handleGenerateStaffEvalLinks = async () => {
    if (!staffEvalMethodData || !staffEvalTemplate) {
      alert("Selecciona una plantilla de evaluación")
      return
    }

    // Validate evaluators
    const invalidEvaluators = staffEvalEvaluators.filter(e => !e.name || !e.email)
    if (invalidEvaluators.length > 0) {
      alert("Por favor completa el nombre y correo de todos los evaluadores")
      return
    }

    try {
      const supabase = createClient()
      const { staffId, evalType } = staffEvalMethodData

      // Create main staff evaluation
      const { data: evalData, error: evalError } = await supabase
        .from("staff_evaluations")
        .insert({
          staff_id: staffId,
          evaluation_type: evalType,
          template_id: staffEvalTemplate,
          status: "in_progress",
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (evalError) {
        console.error("Error creating staff evaluation:", evalError)
        alert("Error al crear la evaluación: " + evalError.message)
        return
      }

      setStaffEvaluations(prev => [...prev, evalData])

      // Create assignments and tokens for each evaluator
      const links: Array<{ type: string; name: string; link: string }> = []
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 14) // 14 days

      for (const evaluator of staffEvalEvaluators) {
        // Find evaluator_id if they are staff
        let evaluatorId = null
        if (evaluator.type === "self") {
          evaluatorId = staffId
        } else {
          const matchingStaff = staffList.find(
            s => s.email?.toLowerCase() === evaluator.email.toLowerCase()
          )
          if (matchingStaff) {
            evaluatorId = matchingStaff.id
          }
        }

        // Create assignment
        const { data: assignmentData, error: assignmentError } = await supabase
          .from("staff_evaluation_assignments")
          .insert({
            staff_evaluation_id: evalData.id,
            evaluator_type: evaluator.type,
            evaluator_id: evaluatorId,
            evaluator_name: evaluator.name,
            evaluator_email: evaluator.email,
            status: "pending",
          })
          .select()
          .single()

        if (assignmentError) {
          console.error("Error creating assignment:", assignmentError)
          continue
        }

        // Create token
        const token = crypto.randomUUID()
        const { error: tokenError } = await supabase
          .from("staff_evaluation_tokens")
          .insert({
            assignment_id: assignmentData.id,
            token: token,
            expires_at: expiresAt.toISOString(),
          })

        if (tokenError) {
          console.error("Error creating token:", tokenError)
          continue
        }

        const baseUrl = window.location.origin
        const link = `${baseUrl}/evaluacion-360/${token}`
        
        const typeLabels: Record<string, string> = {
          self: "Autoevaluación",
          supervisor: "Supervisor",
          peer: "Par",
          subordinate: "Subordinado"
        }

        links.push({
          type: typeLabels[evaluator.type],
          name: evaluator.name,
          link: link,
        })
      }

      setStaffEvalGeneratedLinks(links)
    } catch (err) {
      console.error("Error generating links:", err)
      alert("Error al generar los enlaces")
    }
  }

  // Reiniciar evaluación (mantiene el avance pero permite reenviar link)
  const handleResendEvaluation = async () => {
    if (!resendEvalData) return
    setResendingEval(true)
    
    try {
      const supabase = createClient()
      const newToken = crypto.randomUUID()
      const baseUrl = window.location.origin
      const newLink = `${baseUrl}/evaluations/take/${newToken}`
      
      if (resendEvalData.type === "candidate") {
        // Actualizar la evaluación del candidato con nuevo token/link
        const { error } = await supabase
          .from("candidate_evaluations")
          .update({ 
            evaluation_link: newLink,
            token: newToken,
            updated_at: new Date().toISOString()
          })
          .eq("id", resendEvalData.id)
        
        if (error) throw error
        
        // Actualizar estado local
        setCandidateEvaluations(prev => prev.map(e => 
          e.id === resendEvalData.id 
            ? { ...e, evaluation_link: newLink, token: newToken }
            : e
        ))
      } else {
        // Actualizar la asignación de evaluación de staff con nuevo link
        const { error } = await supabase
          .from("staff_evaluation_assignments")
          .update({ 
            evaluation_link: newLink,
            token: newToken,
            updated_at: new Date().toISOString()
          })
          .eq("id", resendEvalData.id)
        
        if (error) throw error
      }
      
      // Mostrar el nuevo link generado
      setResendEvalData(prev => prev ? { ...prev, currentLink: newLink } : null)
      
      alert(`Nuevo link generado exitosamente. El link ha sido actualizado y puede ser reenviado al evaluado.`)
    } catch (err) {
      console.error("Error al reiniciar evaluación:", err)
      alert("Error al generar nuevo link de evaluación")
    } finally {
      setResendingEval(false)
    }
  }

  // Copiar link al portapapeles
  const handleCopyEvalLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link)
      alert("Link copiado al portapapeles")
    } catch (err) {
      console.error("Error al copiar:", err)
    }
  }

  // Abrir diálogo de reenviar evaluación para candidatos
  const handleOpenResendCandidateEval = (candidate: typeof candidatesList[0], evalType: string) => {
    const evaluation = candidateEvaluations.find(
      e => e.candidate_id === candidate.id && e.evaluation_type === evalType
    )
    
    if (!evaluation) {
      alert("No se encontró la evaluación")
      return
    }
    
    setResendEvalData({
      id: evaluation.id,
      type: "candidate",
      evalType: evalType,
      personName: `${candidate.first_name} ${candidate.last_name}`,
      personEmail: candidate.email,
      currentLink: evaluation.evaluation_link || "",
      status: evaluation.status
    })
    setShowResendEvalDialog(true)
  }

  // Abrir diálogo de reenviar evaluación para staff
  const handleOpenResendStaffEval = (staff: typeof staffList[0], evalType: string) => {
    const evaluation = staffEvaluations.find(
      e => e.staff_id === staff.id && e.evaluation_type === evalType
    )
    
    if (!evaluation) {
      alert("No se encontró la evaluación")
      return
    }
    
    setResendEvalData({
      id: evaluation.id,
      type: "staff",
      evalType: evalType,
      personName: `${staff.first_name} ${staff.last_name}`,
      personEmail: staff.email || "",
      currentLink: evaluation.evaluation_link || "",
      status: evaluation.status
    })
    setShowResendEvalDialog(true)
  }

  // Reiniciar evaluación completa (borra avance y genera nuevo link)
  const handleRestartEvaluation = async () => {
    if (!restartEvalData) return
    setRestartingEval(true)
    
    try {
      const supabase = createClient()
      const newToken = crypto.randomUUID()
      const baseUrl = window.location.origin
      const newLink = `${baseUrl}/evaluations/take/${newToken}`
      
      if (restartEvalData.type === "candidate") {
        // Reiniciar la evaluación del candidato
        const updateData: Record<string, unknown> = {
          status: "pending",
          evaluation_link: newLink,
          token: newToken,
          score: null,
          results: null,
          started_at: null,
          completed_at: null,
          updated_at: new Date().toISOString()
        }
        
        // Si se cambió el evaluador
        if (!restartEvalKeepEvaluator && restartEvalNewEvaluatorId) {
          updateData.evaluator_id = restartEvalNewEvaluatorId
        }
        
        const { error } = await supabase
          .from("candidate_evaluations")
          .update(updateData)
          .eq("id", restartEvalData.id)
        
        if (error) throw error
        
        // Actualizar estado local
        setCandidateEvaluations(prev => prev.map(e => 
          e.id === restartEvalData.id 
            ? { ...e, ...updateData }
            : e
        ))
      } else {
        // Reiniciar la evaluación de staff
        const updateData: Record<string, unknown> = {
          status: "pending",
          evaluation_link: newLink,
          token: newToken,
          score: null,
          results: null,
          started_at: null,
          completed_at: null,
          updated_at: new Date().toISOString()
        }
        
        // Si se cambió el evaluador
        if (!restartEvalKeepEvaluator && restartEvalNewEvaluatorId) {
          updateData.evaluator_id = restartEvalNewEvaluatorId
        }
        
        const { error } = await supabase
          .from("staff_evaluation_assignments")
          .update(updateData)
          .eq("id", restartEvalData.id)
        
        if (error) throw error
        
        // Actualizar la evaluación principal también
        const evaluation = staffEvaluations.find(e => 
          e.staff_id === restartEvalData.id.split("-")[0] && 
          e.evaluation_type === restartEvalData.evalType
        )
        if (evaluation) {
          await supabase
            .from("staff_evaluations")
            .update({ 
              status: "pending",
              started_at: null,
              completed_at: null,
              score: null,
              updated_at: new Date().toISOString()
            })
            .eq("id", evaluation.id)
            
          setStaffEvaluations(prev => prev.map(e =>
            e.id === evaluation.id
              ? { ...e, status: "pending", started_at: null, completed_at: null, score: null }
              : e
          ))
        }
      }
      
      setShowRestartEvalDialog(false)
      setRestartEvalData(null)
      setRestartEvalNewEvaluatorId("")
      setRestartEvalKeepEvaluator(true)
      
      alert("Evaluación reiniciada exitosamente. Se ha generado un nuevo link y el avance anterior ha sido eliminado.")
    } catch (err) {
      console.error("Error al reiniciar evaluación:", err)
      alert("Error al reiniciar la evaluación")
    } finally {
      setRestartingEval(false)
    }
  }

  // Abrir diálogo de reiniciar evaluación para candidatos
  const handleOpenRestartCandidateEval = (candidate: typeof candidatesList[0], evalType: string) => {
    const evaluation = candidateEvaluations.find(
      e => e.candidate_id === candidate.id && e.evaluation_type === evalType
    )
    
    if (!evaluation) {
      alert("No se encontró la evaluación")
      return
    }
    
    // Buscar evaluador actual
    const currentEvaluator = staffList.find(s => s.id === evaluation.evaluator_id)
    
    setRestartEvalData({
      id: evaluation.id,
      type: "candidate",
      evalType: evalType,
      personName: `${candidate.first_name} ${candidate.last_name}`,
      personEmail: candidate.email,
      currentEvaluatorId: evaluation.evaluator_id || null,
      currentEvaluatorName: currentEvaluator ? `${currentEvaluator.first_name} ${currentEvaluator.last_name}` : null
    })
    setRestartEvalKeepEvaluator(true)
    setRestartEvalNewEvaluatorId("")
    setShowRestartEvalDialog(true)
  }

  // Abrir diálogo de reiniciar evaluación para staff
  const handleOpenRestartStaffEval = (staff: typeof staffList[0], evalType: string) => {
    const evaluation = staffEvaluations.find(
      e => e.staff_id === staff.id && e.evaluation_type === evalType
    )
    
    if (!evaluation) {
      alert("No se encontró la evaluación")
      return
    }
    
    setRestartEvalData({
      id: evaluation.id,
      type: "staff",
      evalType: evalType,
      personName: `${staff.first_name} ${staff.last_name}`,
      personEmail: staff.email || "",
      currentEvaluatorId: null,
      currentEvaluatorName: null
    })
    setRestartEvalKeepEvaluator(true)
    setRestartEvalNewEvaluatorId("")
    setShowRestartEvalDialog(true)
  }

  // Start internal staff evaluation (apply presentially)
  const handleStartInternalStaffEval = async () => {
    if (!staffEvalMethodData || !staffEvalTemplate) {
      alert("Selecciona una plantilla de evaluación")
      return
    }

    try {
      const supabase = createClient()
      const { staffId, evalType } = staffEvalMethodData

      // Create main staff evaluation
      const { data: evalData, error: evalError } = await supabase
        .from("staff_evaluations")
        .insert({
          staff_id: staffId,
          evaluation_type: evalType,
          template_id: staffEvalTemplate,
          status: "in_progress",
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (evalError) {
        console.error("Error creating staff evaluation:", evalError)
        alert("Error al crear la evaluación: " + evalError.message)
        return
      }

      setStaffEvaluations(prev => [...prev, evalData])

      // Create self-assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("staff_evaluation_assignments")
        .insert({
          staff_evaluation_id: evalData.id,
          evaluator_type: "self",
          evaluator_id: staffId,
          evaluator_name: staffEvalMethodData.staffName,
          evaluator_email: staffEvalMethodData.staff.email || "",
          status: "in_progress",
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (assignmentError) {
        console.error("Error creating assignment:", assignmentError)
        alert("Error al crear la asignación")
        return
      }

      // Find template and normalize its structure
      const rawTemplate = evaluationTemplates.find(t => t.id === staffEvalTemplate)
      if (!rawTemplate) {
        alert("Plantilla no encontrada")
        return
      }

      // Normalize template structure
      const questions = rawTemplate.sampleQuestions?.filter(q => q.type === "scale").map(q => ({
        text: q.question,
        category: ""
      })) || []

      const normalizedTemplate = {
        ...rawTemplate,
        questions,
        scale: [
          { value: 1, label: "Muy por debajo de lo esperado" },
          { value: 2, label: "Por debajo de lo esperado" },
          { value: 3, label: "Cumple lo esperado" },
          { value: 4, label: "Supera lo esperado" },
          { value: 5, label: "Excepcional" },
        ]
      }

      setStaffApplyEvalData({
        template: normalizedTemplate as any,
        staffEvalId: evalData.id,
        assignmentId: assignmentData.id,
      })
      setStaffApplyEvalAnswers({})
      setStaffApplyEvalCurrentQuestion(0)
      setShowStaffEvalMethodDialog(false)
      setShowStaffApplyEvalDialog(true)
    } catch (err) {
      console.error("Error starting internal staff evaluation:", err)
      alert("Error al iniciar la evaluación")
    }
  }

  // Submit internal staff evaluation
  const handleSubmitInternalStaffEval = async () => {
    if (!staffApplyEvalData) return

    try {
      const supabase = createClient()
      const { template, staffEvalId, assignmentId } = staffApplyEvalData

      // Verify all questions answered
      if (Object.keys(staffApplyEvalAnswers).length < template.questions.length) {
        alert("Por favor responde todas las preguntas")
        return
      }

      // Save responses
      const responses = Object.entries(staffApplyEvalAnswers).map(([questionIndex, value]) => ({
        assignment_id: assignmentId,
        question_index: parseInt(questionIndex),
        answer_value: value,
      }))

      const { error: responsesError } = await supabase
        .from("staff_evaluation_responses")
        .insert(responses)

      if (responsesError) {
        console.error("Error saving responses:", responsesError)
        alert("Error al guardar las respuestas")
        return
      }

      // Calculate score
      const totalValue = Object.values(staffApplyEvalAnswers).reduce((sum, val) => sum + val, 0)
      const maxPossible = template.questions.length * 5
      const score = Math.round((totalValue / maxPossible) * 100)

      // Update assignment
      await supabase
        .from("staff_evaluation_assignments")
        .update({
          status: "completed",
          score: score,
          completed_at: new Date().toISOString(),
        })
        .eq("id", assignmentId)

      // Update main evaluation
      await supabase
        .from("staff_evaluations")
        .update({
          status: "completed",
          score: score,
          completed_at: new Date().toISOString(),
        })
        .eq("id", staffEvalId)

      // Update local state
      setStaffEvaluations(prev => prev.map(e => 
        e.id === staffEvalId 
          ? { ...e, status: "completed", score, completed_at: new Date().toISOString() } 
          : e
      ))

      const evalNames: Record<string, string> = {
        "360": "360°",
        "kpis": "KPIs",
        "competencies": "Competencias",
        "potential": "Potencial"
      }

      alert(`Evaluación de ${evalNames[staffEvalMethodData?.evalType || "360"]} completada. Puntaje: ${score}%`)
      setShowStaffApplyEvalDialog(false)
      setStaffEvalMethodData(null)
      setStaffApplyEvalData(null)
    } catch (err) {
      console.error("Error submitting staff evaluation:", err)
      alert("Error al enviar la evaluación")
    }
  }

  const handlePreviewTemplate = (template: typeof evaluationTemplates[0]) => {
    setSelectedTemplate(template)
    setShowPreviewDialog(true)
  }

const handleEditTemplate = (template: typeof evaluationTemplates[0]) => {
  setSelectedTemplate(template)
  setEditTemplateForm({
  name: template.name,
  description: template.description || "",
  category: template.category,
  scope: template.scope || "selection",
  questions: template.questions,
  time: template.time,
  sampleQuestions: template.sampleQuestions ? [...template.sampleQuestions] : [],
  })
  setShowTemplatesDialog(false)
  setShowEditTemplateDialog(true)
  }

const handleSaveTemplate = () => {
  if (selectedTemplate) {
  setTemplatesList(prev => prev.map(t =>
  t.id === selectedTemplate.id
  ? {
  ...t,
  name: editTemplateForm.name,
  description: editTemplateForm.description,
  category: editTemplateForm.category,
  scope: editTemplateForm.scope,
  questions: editTemplateForm.questions,
  time: editTemplateForm.time,
  sampleQuestions: editTemplateForm.sampleQuestions,
  }
  : t
  ))
    }
    setShowEditTemplateDialog(false)
    setSelectedTemplate(null)
  }

  const handleOpenCreateTemplate = () => {
    setNewTemplateForm({
      name: "",
      description: "",
      category: "psychometric",
      scope: "selection",
      questions: 10,
      time: 15,
      sampleQuestions: [],
    })
    setShowTemplatesDialog(false)
    setShowCreateTemplateDialog(true)
  }

const handleCreateTemplate = () => {
  const newTemplate = {
  id: `tpl-${Date.now()}`,
  name: newTemplateForm.name,
  description: newTemplateForm.description,
  category: newTemplateForm.category,
  scope: newTemplateForm.scope,
  questions: newTemplateForm.questions,
  time: newTemplateForm.time,
  sampleQuestions: newTemplateForm.sampleQuestions,
  }
  setTemplatesList(prev => [...prev, newTemplate])
    setShowCreateTemplateDialog(false)
    setNewTemplateForm({
      name: "",
      description: "",
      category: "psychometric",
      questions: 10,
      time: 15,
      sampleQuestions: [],
    })
  }

  const handleAddNewQuestion = () => {
    setNewTemplateForm(prev => ({
      ...prev,
      sampleQuestions: [
        ...prev.sampleQuestions,
        { type: "multiple", question: "", options: ["", "", "", ""] }
      ]
    }))
  }

  const handleRemoveNewQuestion = (index: number) => {
    setNewTemplateForm(prev => ({
      ...prev,
      sampleQuestions: prev.sampleQuestions.filter((_, i) => i !== index)
    }))
  }

  const handleUpdateNewQuestion = (index: number, field: string, value: string | string[]) => {
    setNewTemplateForm(prev => ({
      ...prev,
      sampleQuestions: prev.sampleQuestions.map((q, i) => {
        if (i !== index) return q
        if (field === "type") {
          const newQuestion: typeof q = { type: value as string, question: q.question }
          if (value === "multiple") {
            newQuestion.options = ["", "", "", ""]
          } else if (value === "scale") {
            newQuestion.scale = "1-5"
          } else if (value === "code") {
            newQuestion.language = "javascript"
          }
          return newQuestion
        }
        return { ...q, [field]: value }
      })
    }))
  }

  const handleUpdateNewOption = (questionIndex: number, optionIndex: number, value: string) => {
    setNewTemplateForm(prev => ({
      ...prev,
      sampleQuestions: prev.sampleQuestions.map((q, i) => {
        if (i !== questionIndex || !q.options) return q
        const newOptions = [...q.options]
        newOptions[optionIndex] = value
        return { ...q, options: newOptions }
      })
    }))
  }

  const handleAddNewOption = (questionIndex: number) => {
    setNewTemplateForm(prev => ({
      ...prev,
      sampleQuestions: prev.sampleQuestions.map((q, i) => {
        if (i !== questionIndex || !q.options) return q
        return { ...q, options: [...q.options, ""] }
      })
    }))
  }

  const handleRemoveNewOption = (questionIndex: number, optionIndex: number) => {
    setNewTemplateForm(prev => ({
      ...prev,
      sampleQuestions: prev.sampleQuestions.map((q, i) => {
        if (i !== questionIndex || !q.options) return q
        return { ...q, options: q.options.filter((_, oi) => oi !== optionIndex) }
      })
    }))
  }

  const handleAddQuestion = () => {
    setEditTemplateForm(prev => ({
      ...prev,
      sampleQuestions: [
        ...prev.sampleQuestions,
        { type: "multiple", question: "", options: ["", "", "", ""] }
      ]
    }))
  }

  const handleRemoveQuestion = (index: number) => {
    setEditTemplateForm(prev => ({
      ...prev,
      sampleQuestions: prev.sampleQuestions.filter((_, i) => i !== index)
    }))
  }

  const handleUpdateQuestion = (index: number, field: string, value: string | string[]) => {
    setEditTemplateForm(prev => ({
      ...prev,
      sampleQuestions: prev.sampleQuestions.map((q, i) => {
        if (i !== index) return q
        if (field === "type") {
          // Reset options/scale based on type
          const newQuestion: typeof q = { type: value as string, question: q.question }
          if (value === "multiple") {
            newQuestion.options = ["", "", "", ""]
          } else if (value === "scale") {
            newQuestion.scale = "1-5"
          } else if (value === "code") {
            newQuestion.language = "javascript"
          }
          return newQuestion
        }
        return { ...q, [field]: value }
      })
    }))
  }

  const handleUpdateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setEditTemplateForm(prev => ({
      ...prev,
      sampleQuestions: prev.sampleQuestions.map((q, i) => {
        if (i !== questionIndex || !q.options) return q
        const newOptions = [...q.options]
        newOptions[optionIndex] = value
        return { ...q, options: newOptions }
      })
    }))
  }

  const handleAddOption = (questionIndex: number) => {
    setEditTemplateForm(prev => ({
      ...prev,
      sampleQuestions: prev.sampleQuestions.map((q, i) => {
        if (i !== questionIndex || !q.options) return q
        return { ...q, options: [...q.options, ""] }
      })
    }))
  }

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    setEditTemplateForm(prev => ({
      ...prev,
      sampleQuestions: prev.sampleQuestions.map((q, i) => {
        if (i !== questionIndex || !q.options) return q
        return { ...q, options: q.options.filter((_, oi) => oi !== optionIndex) }
      })
    }))
  }

  // KPI calculations
  const totalEvaluations = mockEvaluations.length
  const activeEvaluations = mockEvaluations.filter(e => e.status === "active").length
  const completedThisMonth = mockEvaluations.filter(e => e.status === "completed").length
  const avgCompletionRate = Math.round(
    mockEvaluations.reduce((acc, e) => acc + (e.applicants > 0 ? (e.completed / e.applicants) * 100 : 0), 0) / totalEvaluations
  )

  const filteredEvaluations = mockEvaluations.filter(evaluation => {
    const matchesSearch = evaluation.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || evaluation.type === filterType
    const matchesStatus = filterStatus === "all" || evaluation.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-amber-600"
    return "text-red-600"
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-amber-500"
    return "bg-red-500"
  }

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <ArrowUpRight className="h-4 w-4 text-green-500" />
    if (trend === "down") return <ArrowDownRight className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Evaluaciones</h1>
          <p className="text-muted-foreground">
            Gestiona evaluaciones de selección y permanencia del personal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowTemplatesDialog(true)}>
            <BookOpen className="mr-2 h-4 w-4" />
            Plantillas
          </Button>
          <Button onClick={() => setShowNewEvaluationDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Evaluación
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="selection" className="gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Selección</span>
          </TabsTrigger>
          <TabsTrigger value="permanence" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Permanencia</span>
          </TabsTrigger>
          <TabsTrigger value="objectives" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Objetivos</span>
          </TabsTrigger>
          <TabsTrigger value="ninebox" className="gap-2">
            <Grid3X3 className="h-4 w-4" />
            <span className="hidden sm:inline">Nine Box</span>
          </TabsTrigger>
          <TabsTrigger value="climate" className="gap-2">
            <ThermometerSun className="h-4 w-4" />
            <span className="hidden sm:inline">Clima</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Evaluaciones</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEvaluations}</div>
                <p className="text-xs text-muted-foreground">
                  {mockEvaluations.filter(e => e.type === "selection").length} selección, {mockEvaluations.filter(e => e.type === "permanence").length} permanencia
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Evaluaciones Activas</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeEvaluations}</div>
                <p className="text-xs text-muted-foreground">
                  En proceso actualmente
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Completado</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgCompletionRate}%</div>
                <Progress value={avgCompletionRate} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Candidatos Evaluados</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockCandidates.length}</div>
                <p className="text-xs text-muted-foreground">
                  Este mes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Competencies Radar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Radar de Competencias</CardTitle>
                <CardDescription>Promedio de competencias evaluadas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={competenciesData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <RechartsRadar name="Promedio Actual" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                    <RechartsRadar name="Objetivo" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Evaluation Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evaluaciones por Estado</CardTitle>
                <CardDescription>Distribución actual de evaluaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: "Activas", value: activeEvaluations, fill: "#22c55e" },
                    { name: "Completadas", value: completedThisMonth, fill: "#3b82f6" },
                    { name: "Borrador", value: mockEvaluations.filter(e => e.status === "draft").length, fill: "#6b7280" },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {[
                        { fill: "#22c55e" },
                        { fill: "#3b82f6" },
                        { fill: "#6b7280" },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Evaluations Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Evaluaciones Recientes</CardTitle>
                  <CardDescription>Últimas evaluaciones creadas o actualizadas</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      className="pl-8 w-[200px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="selection">Selección</SelectItem>
                      <SelectItem value="permanence">Permanencia</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Activas</SelectItem>
                      <SelectItem value="completed">Completadas</SelectItem>
                      <SelectItem value="draft">Borrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay evaluaciones recientes para mostrar.
              </p>
            </CardContent>
          </Card>
      </TabsContent>

      {/* Selection Tab */}
      <TabsContent value="selection" className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Evaluaciones de Selección</h2>
            <p className="text-sm text-muted-foreground">Gestiona las evaluaciones psicométricas, técnicas y de personalidad para candidatos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowNewCandidateDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo Candidato
            </Button>
            <Button onClick={() => setShowStartCandidateEvalDialog(true)}>
              <Play className="h-4 w-4 mr-2" />
              Iniciar Evaluación
            </Button>
          </div>
        </div>

        {/* Selection Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-transparent rounded-bl-full" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Candidatos</p>
                  <p className="text-3xl font-bold">{candidatesList.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">En proceso de selección</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/20 to-transparent rounded-bl-full" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Evaluaciones Completadas</p>
                  <p className="text-3xl font-bold text-green-600">
                    {candidateEvaluations.filter(e => e.status === "completed").length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    de {candidateEvaluations.length} total
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/20 to-transparent rounded-bl-full" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">En Proceso</p>
                  <p className="text-3xl font-bold text-amber-600">
                    {candidateEvaluations.filter(e => e.status === "in_progress").length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Evaluaciones activas</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-full" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Promedio General</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {candidateEvaluations.filter(e => e.status === "completed" && e.score).length > 0
                      ? Math.round(candidateEvaluations.filter(e => e.status === "completed" && e.score).reduce((sum, e) => sum + (e.score || 0), 0) / candidateEvaluations.filter(e => e.status === "completed" && e.score).length)
                      : "--"}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Score promedio</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress by Evaluation Type */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Psicométrico</h4>
                  <p className="text-xs text-muted-foreground">Evaluaciones cognitivas</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Completadas</span>
                  <span className="font-medium">
                    {candidateEvaluations.filter(e => e.evaluation_type === "psychometric" && e.status === "completed").length} / {candidatesList.length}
                  </span>
                </div>
                <Progress 
                  value={candidatesList.length > 0 ? (candidateEvaluations.filter(e => e.evaluation_type === "psychometric" && e.status === "completed").length / candidatesList.length) * 100 : 0} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Promedio: {(() => {
                    const completed = candidateEvaluations.filter(e => e.evaluation_type === "psychometric" && e.status === "completed" && e.score)
                    return completed.length > 0 ? Math.round(completed.reduce((sum, e) => sum + (e.score || 0), 0) / completed.length) : "--"
                  })()}%
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Personalidad</h4>
                  <p className="text-xs text-muted-foreground">Perfiles DISC</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Completadas</span>
                  <span className="font-medium">
                    {candidateEvaluations.filter(e => e.evaluation_type === "personality" && e.status === "completed").length} / {candidatesList.length}
                  </span>
                </div>
                <Progress 
                  value={candidatesList.length > 0 ? (candidateEvaluations.filter(e => e.evaluation_type === "personality" && e.status === "completed").length / candidatesList.length) * 100 : 0} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Promedio: {(() => {
                    const completed = candidateEvaluations.filter(e => e.evaluation_type === "personality" && e.status === "completed" && e.score)
                    return completed.length > 0 ? Math.round(completed.reduce((sum, e) => sum + (e.score || 0), 0) / completed.length) : "--"
                  })()}%
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Code className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Técnico</h4>
                  <p className="text-xs text-muted-foreground">Habilidades técnicas</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Completadas</span>
                  <span className="font-medium">
                    {candidateEvaluations.filter(e => e.evaluation_type === "technical" && e.status === "completed").length} / {candidatesList.length}
                  </span>
                </div>
                <Progress 
                  value={candidatesList.length > 0 ? (candidateEvaluations.filter(e => e.evaluation_type === "technical" && e.status === "completed").length / candidatesList.length) * 100 : 0} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Promedio: {(() => {
                    const completed = candidateEvaluations.filter(e => e.evaluation_type === "technical" && e.status === "completed" && e.score)
                    return completed.length > 0 ? Math.round(completed.reduce((sum, e) => sum + (e.score || 0), 0) / completed.length) : "--"
                  })()}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar candidato..."
              value={candidateSearchTerm}
              onChange={(e) => setCandidateSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Candidates Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidato</TableHead>
                  <TableHead>Puesto</TableHead>
                  <TableHead>Psicométrico</TableHead>
                  <TableHead>Personalidad</TableHead>
                  <TableHead>Técnico</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingCandidates ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : candidatesList.filter(c => 
                  c.first_name.toLowerCase().includes(candidateSearchTerm.toLowerCase()) ||
                  c.last_name.toLowerCase().includes(candidateSearchTerm.toLowerCase())
                ).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No hay candidatos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  candidatesList
                    .filter(c => 
                      c.first_name.toLowerCase().includes(candidateSearchTerm.toLowerCase()) ||
                      c.last_name.toLowerCase().includes(candidateSearchTerm.toLowerCase())
                    )
                    .map((candidate) => {
                      const getEvalStatus = (type: string) => {
                        const eval_ = candidateEvaluations.find(
                          e => e.candidate_id === candidate.id && e.evaluation_type === type
                        )
                        if (!eval_) return { status: "pending", score: null }
                        return { status: eval_.status, score: eval_.score }
                      }
                      const psycho = getEvalStatus("psychometric")
                      const personality = getEvalStatus("personality")
                      const technical = getEvalStatus("technical")
                      
                      return (
                        <TableRow key={candidate.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {candidate.first_name[0]}{candidate.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{candidate.first_name} {candidate.last_name}</div>
                                <div className="text-xs text-muted-foreground">{candidate.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{candidate.position_applied || "-"}</TableCell>
                          <TableCell>
                            {psycho.status === "completed" ? (
                              <Badge className="bg-green-100 text-green-700">{psycho.score}%</Badge>
                            ) : psycho.status === "in_progress" ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">En proceso</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Sin evaluar</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {personality.status === "completed" ? (
                              <Badge className="bg-green-100 text-green-700">{personality.score}%</Badge>
                            ) : personality.status === "in_progress" ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">En proceso</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Sin evaluar</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {technical.status === "completed" ? (
                              <Badge className="bg-green-100 text-green-700">{technical.score}%</Badge>
                            ) : technical.status === "in_progress" ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">En proceso</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Sin evaluar</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              candidate.status === "active" ? "bg-green-50 text-green-700" :
                              candidate.status === "hired" ? "bg-blue-50 text-blue-700" :
                              candidate.status === "rejected" ? "bg-red-50 text-red-700" :
                              "bg-gray-50 text-gray-700"
                            }>
                              {candidate.status === "active" ? "Activo" :
                               candidate.status === "hired" ? "Contratado" :
                               candidate.status === "rejected" ? "Rechazado" : candidate.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setEvalMethodData({
                                    candidateId: candidate.id,
                                    evalType: "psychometric",
                                    candidateName: `${candidate.first_name} ${candidate.last_name}`
                                  })
                                  setGeneratedLink(null)
                                  setShowEvalMethodDialog(true)
                                }} disabled={psycho.status !== "pending"}>
                                  <Brain className="h-4 w-4 mr-2" />
                                  {psycho.status === "pending" ? "Evaluar Psicométrico" : "Psicométrico " + (psycho.status === "completed" ? "completado" : "en proceso")}
                                </DropdownMenuItem>
                                {psycho.status === "in_progress" && (
                                  <DropdownMenuItem onClick={() => handleOpenResendCandidateEval(candidate, "psychometric")}>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Reenviar link Psicométrico
                                  </DropdownMenuItem>
                                )}
                                {(psycho.status === "in_progress" || psycho.status === "completed") && (
                                  <DropdownMenuItem onClick={() => handleOpenRestartCandidateEval(candidate, "psychometric")} className="text-amber-600">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Reiniciar Psicométrico
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => {
                                  setEvalMethodData({
                                    candidateId: candidate.id,
                                    evalType: "personality",
                                    candidateName: `${candidate.first_name} ${candidate.last_name}`
                                  })
                                  setGeneratedLink(null)
                                  setShowEvalMethodDialog(true)
                                }} disabled={personality.status !== "pending"}>
                                  <Heart className="h-4 w-4 mr-2" />
                                  {personality.status === "pending" ? "Evaluar Personalidad" : "Personalidad " + (personality.status === "completed" ? "completado" : "en proceso")}
                                </DropdownMenuItem>
                                {personality.status === "in_progress" && (
                                  <DropdownMenuItem onClick={() => handleOpenResendCandidateEval(candidate, "personality")}>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Reenviar link Personalidad
                                  </DropdownMenuItem>
                                )}
                                {(personality.status === "in_progress" || personality.status === "completed") && (
                                  <DropdownMenuItem onClick={() => handleOpenRestartCandidateEval(candidate, "personality")} className="text-amber-600">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Reiniciar Personalidad
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => {
                                  setEvalMethodData({
                                    candidateId: candidate.id,
                                    evalType: "technical",
                                    candidateName: `${candidate.first_name} ${candidate.last_name}`
                                  })
                                  setGeneratedLink(null)
                                  setShowEvalMethodDialog(true)
                                }} disabled={technical.status !== "pending"}>
                                  <Code className="h-4 w-4 mr-2" />
                                  {technical.status === "pending" ? "Evaluar Técnico" : "Técnico " + (technical.status === "completed" ? "completado" : "en proceso")}
                                </DropdownMenuItem>
                                {technical.status === "in_progress" && (
                                  <DropdownMenuItem onClick={() => handleOpenResendCandidateEval(candidate, "technical")}>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Reenviar link Técnico
                                  </DropdownMenuItem>
                                )}
                                {(technical.status === "in_progress" || technical.status === "completed") && (
                                  <DropdownMenuItem onClick={() => handleOpenRestartCandidateEval(candidate, "technical")} className="text-amber-600">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Reiniciar Técnico
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Resultados
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Permanence Tab */}
      <TabsContent value="permanence" className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Evaluaciones de Permanencia</h2>
            <p className="text-sm text-muted-foreground">Gestiona las evaluaciones 360°, KPIs, competencias y potencial de colaboradores</p>
          </div>
          <Button onClick={() => setShowStartPermanenceEvalDialog(true)}>
            <Play className="h-4 w-4 mr-2" />
            Iniciar Evaluación
          </Button>
        </div>

        {/* Permanence Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden border-l-4 border-l-indigo-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Colaboradores</p>
                  <p className="text-3xl font-bold">{staffList.length}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-green-600 font-medium">Activos</span>
                  </div>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-l-4 border-l-emerald-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Evaluaciones 360°</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {staffEvaluations.filter(e => e.evaluation_type === "360" && e.status === "completed").length}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {staffEvaluations.filter(e => e.evaluation_type === "360" && e.status === "in_progress").length} en proceso
                    </span>
                  </div>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <Target className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-l-4 border-l-amber-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cobertura KPIs</p>
                  <p className="text-3xl font-bold text-amber-600">
                    {staffList.length > 0 ? Math.round((staffEvaluations.filter(e => e.evaluation_type === "kpis" && e.status === "completed").length / staffList.length) * 100) : 0}%
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {staffEvaluations.filter(e => e.evaluation_type === "kpis" && e.status === "completed").length} de {staffList.length}
                    </span>
                  </div>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-l-4 border-l-violet-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Potencial Identificado</p>
                  <p className="text-3xl font-bold text-violet-600">
                    {staffEvaluations.filter(e => e.evaluation_type === "potential" && e.status === "completed" && (e.score || 0) >= 70).length}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-muted-foreground">Alto potencial ({">"}70%)</span>
                  </div>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg">
                  <Zap className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Evaluation Progress by Type */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Progreso de Evaluaciones</CardTitle>
              <CardDescription>Estado de evaluaciones por tipo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "360°", type: "360", color: "bg-emerald-500", icon: Target },
                { name: "KPIs", type: "kpis", color: "bg-amber-500", icon: TrendingUp },
                { name: "Competencias", type: "competencies", color: "bg-blue-500", icon: Award },
                { name: "Potencial", type: "potential", color: "bg-violet-500", icon: Zap },
              ].map((item) => {
                const completed = staffEvaluations.filter(e => e.evaluation_type === item.type && e.status === "completed").length
                const inProgress = staffEvaluations.filter(e => e.evaluation_type === item.type && e.status === "in_progress").length
                const total = staffList.length
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
                
                return (
                  <div key={item.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-lg ${item.color} flex items-center justify-center`}>
                          <item.icon className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium text-sm">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold">{completed}</span>
                        <span className="text-xs text-muted-foreground"> / {total}</span>
                        {inProgress > 0 && (
                          <span className="text-xs text-amber-600 ml-2">+{inProgress} activas</span>
                        )}
                      </div>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`absolute left-0 top-0 h-full ${item.color} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Distribución de Resultados</CardTitle>
              <CardDescription>Scores de evaluaciones completadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Excelente", range: "90-100%", color: "bg-emerald-500", count: staffEvaluations.filter(e => e.status === "completed" && (e.score || 0) >= 90).length },
                  { label: "Bueno", range: "70-89%", color: "bg-blue-500", count: staffEvaluations.filter(e => e.status === "completed" && (e.score || 0) >= 70 && (e.score || 0) < 90).length },
                  { label: "Regular", range: "50-69%", color: "bg-amber-500", count: staffEvaluations.filter(e => e.status === "completed" && (e.score || 0) >= 50 && (e.score || 0) < 70).length },
                  { label: "Bajo", range: "30-49%", color: "bg-orange-500", count: staffEvaluations.filter(e => e.status === "completed" && (e.score || 0) >= 30 && (e.score || 0) < 50).length },
                  { label: "Crítico", range: "0-29%", color: "bg-red-500", count: staffEvaluations.filter(e => e.status === "completed" && (e.score || 0) < 30).length },
                  { label: "Pendientes", range: "Sin evaluar", color: "bg-gray-400", count: (staffList.length * 4) - staffEvaluations.filter(e => e.status === "completed").length },
                ].map((item) => (
                  <div key={item.label} className="text-center p-3 rounded-xl bg-muted/50">
                    <div className={`h-3 w-3 rounded-full ${item.color} mx-auto mb-2`} />
                    <p className="text-2xl font-bold">{item.count}</p>
                    <p className="text-xs font-medium">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.range}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar colaborador..."
              value={staffSearchTerm}
              onChange={(e) => setStaffSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Staff Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>360°</TableHead>
                  <TableHead>KPIs</TableHead>
                  <TableHead>Competencias</TableHead>
                  <TableHead>Potencial</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingStaff ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No hay colaboradores registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((staff) => {
                    const getEvalStatus = (type: string) => {
                      const eval_ = staffEvaluations.find(
                        e => e.staff_id === staff.id && e.evaluation_type === type
                      )
                      if (!eval_) return { status: "pending", score: null }
                      return { status: eval_.status, score: eval_.score }
                    }
                    const eval360 = getEvalStatus("360")
                    const kpis = getEvalStatus("kpis")
                    const competencies = getEvalStatus("competencies")
                    const potential = getEvalStatus("potential")
                    
                    return (
                      <TableRow key={staff.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {staff.first_name[0]}{staff.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{staff.first_name} {staff.last_name}</div>
                              <div className="text-xs text-muted-foreground">{staff.position || "Sin puesto"}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{staff.department || "-"}</TableCell>
                        <TableCell>
                          {eval360.status === "completed" ? (
                            <Badge className="bg-green-100 text-green-700">{eval360.score}%</Badge>
                          ) : eval360.status === "in_progress" ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">En proceso</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Sin evaluar</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {kpis.status === "completed" ? (
                            <Badge className="bg-green-100 text-green-700">{kpis.score}%</Badge>
                          ) : kpis.status === "in_progress" ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">En proceso</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Sin evaluar</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {competencies.status === "completed" ? (
                            <Badge className="bg-green-100 text-green-700">{competencies.score}%</Badge>
                          ) : competencies.status === "in_progress" ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">En proceso</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Sin evaluar</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {potential.status === "completed" ? (
                            <Badge className="bg-green-100 text-green-700">{potential.score}%</Badge>
                          ) : potential.status === "in_progress" ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">En proceso</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Sin evaluar</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleStartStaffEvaluation(staff.id, "360")}
                                disabled={eval360.status !== "pending"}
                              >
                                <Target className="h-4 w-4 mr-2" />
                                {eval360.status === "pending" ? "Iniciar 360°" : "360° " + (eval360.status === "completed" ? "completado" : "en proceso")}
                              </DropdownMenuItem>
                              {eval360.status === "in_progress" && (
                                <DropdownMenuItem onClick={() => handleOpenResendStaffEval(staff, "360")}>
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Reenviar link 360°
                                </DropdownMenuItem>
                              )}
                              {(eval360.status === "in_progress" || eval360.status === "completed") && (
                                <DropdownMenuItem onClick={() => handleOpenRestartStaffEval(staff, "360")} className="text-amber-600">
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Reiniciar 360°
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleStartStaffEvaluation(staff.id, "kpis")}
                                disabled={kpis.status !== "pending"}
                              >
                                <TrendingUp className="h-4 w-4 mr-2" />
                                {kpis.status === "pending" ? "Evaluar KPIs" : "KPIs " + (kpis.status === "completed" ? "completado" : "en proceso")}
                              </DropdownMenuItem>
                              {kpis.status === "in_progress" && (
                                <DropdownMenuItem onClick={() => handleOpenResendStaffEval(staff, "kpis")}>
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Reenviar link KPIs
                                </DropdownMenuItem>
                              )}
                              {(kpis.status === "in_progress" || kpis.status === "completed") && (
                                <DropdownMenuItem onClick={() => handleOpenRestartStaffEval(staff, "kpis")} className="text-amber-600">
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Reiniciar KPIs
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleStartStaffEvaluation(staff.id, "competencies")}
                                disabled={competencies.status !== "pending"}
                              >
                                <Award className="h-4 w-4 mr-2" />
                                {competencies.status === "pending" ? "Evaluar Competencias" : "Competencias " + (competencies.status === "completed" ? "completado" : "en proceso")}
                              </DropdownMenuItem>
                              {competencies.status === "in_progress" && (
                                <DropdownMenuItem onClick={() => handleOpenResendStaffEval(staff, "competencies")}>
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Reenviar link Competencias
                                </DropdownMenuItem>
                              )}
                              {(competencies.status === "in_progress" || competencies.status === "completed") && (
                                <DropdownMenuItem onClick={() => handleOpenRestartStaffEval(staff, "competencies")} className="text-amber-600">
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Reiniciar Competencias
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleStartStaffEvaluation(staff.id, "potential")}
                                disabled={potential.status !== "pending"}
                              >
                                <Zap className="h-4 w-4 mr-2" />
                                {potential.status === "pending" ? "Evaluar Potencial" : "Potencial " + (potential.status === "completed" ? "completado" : "en proceso")}
                              </DropdownMenuItem>
                              {potential.status === "in_progress" && (
                                <DropdownMenuItem onClick={() => handleOpenResendStaffEval(staff, "potential")}>
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Reenviar link Potencial
                                </DropdownMenuItem>
                              )}
                              {(potential.status === "in_progress" || potential.status === "completed") && (
                                <DropdownMenuItem onClick={() => handleOpenRestartStaffEval(staff, "potential")} className="text-amber-600">
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Reiniciar Potencial
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Resultados
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Objetivos Tab */}
      <TabsContent value="objectives" className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Objetivos</h2>
            <p className="text-sm text-muted-foreground">
              Crea objetivos por colaborador y da seguimiento o evalúa su cumplimiento
            </p>
          </div>
          <Button onClick={() => setShowNewObjectiveDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Objetivo
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Objetivos</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{objectives.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{objectives.filter(o => o.status === "in_progress").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completados</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{objectives.filter(o => o.status === "completed").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avance Promedio</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {objectives.length > 0
                  ? Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length)
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {objectives.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">Aún no hay objetivos</p>
              <p className="text-sm text-muted-foreground">Crea el primer objetivo para empezar a darle seguimiento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {objectives.map((obj) => {
              const statusCfg = objectiveStatusConfig[obj.status]
              return (
                <Card key={obj.id}>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">{obj.title}</CardTitle>
                          <Badge variant="outline" className={statusCfg.className}>{statusCfg.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{obj.description}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{obj.staffName}</span>
                          <span>·</span>
                          <span>{obj.period}</span>
                          {obj.dueDate && (<><span>·</span><span>Vence: {obj.dueDate}</span></>)}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveObjectiveId(obj.id)
                          setFollowUpForm({ progress: obj.progress, note: "" })
                          setShowObjectiveFollowUpDialog(true)
                        }}
                      >
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Seguimiento
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Avance</span>
                        <span className="font-medium">{obj.progress}%</span>
                      </div>
                      <Progress value={obj.progress} />
                    </div>
                    {obj.followUps.length > 0 && (
                      <div className="rounded-lg border p-3">
                        <p className="text-xs font-medium mb-2">Historial de seguimiento</p>
                        <div className="space-y-2">
                          {obj.followUps.map((fu) => (
                            <div key={fu.id} className="flex items-start gap-2 text-xs">
                              <span className="text-muted-foreground shrink-0">{fu.date}</span>
                              <span className="font-medium shrink-0">{fu.progress}%</span>
                              <span className="text-muted-foreground">{fu.note}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </TabsContent>

      {/* Nine Box Tab */}
      <TabsContent value="ninebox" className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Matriz Nine Box</h2>
            <p className="text-sm text-muted-foreground">Visualiza el desempeño y potencial de los colaboradores en una matriz 3x3</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Nine Box Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-700">
                    {staffList.filter(s => {
                      const perf = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "kpis")
                      const pot = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "potential")
                      return perf?.score && pot?.score && perf.score >= 70 && pot.score >= 70
                    }).length}
                  </p>
                  <p className="text-xs text-emerald-600 font-medium">Estrellas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">
                    {staffList.filter(s => {
                      const perf = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "kpis")
                      const pot = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "potential")
                      return perf?.score && pot?.score && pot.score >= 70
                    }).length}
                  </p>
                  <p className="text-xs text-blue-600 font-medium">Alto Potencial</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700">
                    {staffList.filter(s => {
                      const perf = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "kpis")
                      const pot = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "potential")
                      return perf?.score && pot?.score && (perf.score < 40 || pot.score < 40)
                    }).length}
                  </p>
                  <p className="text-xs text-amber-600 font-medium">Requieren Atención</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-700">
                    {staffList.filter(s => {
                      const perf = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "kpis")
                      const pot = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "potential")
                      return !perf?.score || !pot?.score
                    }).length}
                  </p>
                  <p className="text-xs text-gray-600 font-medium">Sin Clasificar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Nine Box Matrix */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Matriz de Talento</CardTitle>
                <CardDescription>Haz clic en cada celda para ver los colaboradores</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded bg-emerald-500" />
                  <span>Retener</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded bg-blue-500" />
                  <span>Desarrollar</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded bg-amber-500" />
                  <span>Atención</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-4 gap-3">
              {/* Y-Axis Label */}
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="flex-1 flex items-center">
                  <span className="text-sm font-semibold text-muted-foreground -rotate-90 whitespace-nowrap tracking-wider">POTENCIAL</span>
                </div>
                <div className="flex flex-col gap-1 text-[10px] text-muted-foreground text-center">
                  <span className="h-16 flex items-center">Alto</span>
                  <span className="h-16 flex items-center">Medio</span>
                  <span className="h-16 flex items-center">Bajo</span>
                </div>
              </div>
              
              {/* Matrix */}
              <div className="col-span-3 grid grid-cols-3 gap-3">
                {/* Row 1 - High Potential */}
                <div className="h-24 border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-3 flex flex-col cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-yellow-700">Enigma</span>
                    <AlertCircle className="h-3 w-3 text-yellow-600" />
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-3xl font-black text-yellow-600 group-hover:scale-110 transition-transform">
                      {staffList.filter(s => {
                        const perf = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "kpis")
                        const pot = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "potential")
                        return perf?.score && pot?.score && perf.score < 40 && pot.score >= 70
                      }).length}
                    </span>
                  </div>
                </div>
                <div className="h-24 border-2 border-green-400 bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 flex flex-col cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-green-700">Emergente</span>
                    <Star className="h-3 w-3 text-green-600" />
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-3xl font-black text-green-600 group-hover:scale-110 transition-transform">
                      {staffList.filter(s => {
                        const perf = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "kpis")
                        const pot = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "potential")
                        return perf?.score && pot?.score && perf.score >= 40 && perf.score < 70 && pot.score >= 70
                      }).length}
                    </span>
                  </div>
                </div>
                <div className="h-24 border-2 border-emerald-500 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl p-3 flex flex-col cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all group ring-2 ring-emerald-300 ring-offset-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800">ESTRELLA</span>
                    <Star className="h-4 w-4 text-emerald-600 fill-emerald-400" />
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-4xl font-black text-emerald-700 group-hover:scale-110 transition-transform">
                      {staffList.filter(s => {
                        const perf = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "kpis")
                        const pot = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "potential")
                        return perf?.score && pot?.score && perf.score >= 70 && pot.score >= 70
                      }).length}
                    </span>
                  </div>
                </div>
                
                {/* Row 2 - Medium Potential */}
                <div className="h-24 border-2 border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 flex flex-col cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-700">Inconsistente</span>
                    <AlertCircle className="h-3 w-3 text-orange-600" />
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-3xl font-black text-orange-600 group-hover:scale-110 transition-transform">
                      {staffList.filter(s => {
                        const perf = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "kpis")
                        const pot = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "potential")
                        return perf?.score && pot?.score && perf.score < 40 && pot.score >= 40 && pot.score < 70
                      }).length}
                    </span>
                  </div>
                </div>
                <div className="h-24 border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 flex flex-col cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700">Contribuidor</span>
                    <Users className="h-3 w-3 text-blue-600" />
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-3xl font-black text-blue-600 group-hover:scale-110 transition-transform">
                      {staffList.filter(s => {
                        const perf = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "kpis")
                        const pot = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "potential")
                        return perf?.score && pot?.score && perf.score >= 40 && perf.score < 70 && pot.score >= 40 && pot.score < 70
                      }).length}
                    </span>
                  </div>
                </div>
                <div className="h-24 border-2 border-teal-400 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-3 flex flex-col cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-700">Alto Rendimiento</span>
                    <TrendingUp className="h-3 w-3 text-teal-600" />
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-3xl font-black text-teal-600 group-hover:scale-110 transition-transform">
                      {staffList.filter(s => {
                        const perf = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "kpis")
                        const pot = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "potential")
                        return perf?.score && pot?.score && perf.score >= 70 && pot.score >= 40 && pot.score < 70
                      }).length}
                    </span>
                  </div>
                </div>
                
                {/* Row 3 - Low Potential */}
                <div className="h-24 border-2 border-red-400 bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 flex flex-col cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-700">Riesgo</span>
                    <XCircle className="h-3 w-3 text-red-600" />
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-3xl font-black text-red-600 group-hover:scale-110 transition-transform">
                      {staffList.filter(s => {
                        const perf = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "kpis")
                        const pot = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "potential")
                        return perf?.score && pot?.score && perf.score < 40 && pot.score < 40
                      }).length}
                    </span>
                  </div>
                </div>
                <div className="h-24 border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 flex flex-col cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Efectivo</span>
                    <CheckCircle className="h-3 w-3 text-gray-600" />
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-3xl font-black text-gray-600 group-hover:scale-110 transition-transform">
                      {staffList.filter(s => {
                        const perf = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "kpis")
                        const pot = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "potential")
                        return perf?.score && pot?.score && perf.score >= 40 && perf.score < 70 && pot.score < 40
                      }).length}
                    </span>
                  </div>
                </div>
                <div className="h-24 border-2 border-indigo-400 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-3 flex flex-col cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-700">Sólido</span>
                    <Award className="h-3 w-3 text-indigo-600" />
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-3xl font-black text-indigo-600 group-hover:scale-110 transition-transform">
                      {staffList.filter(s => {
                        const perf = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "kpis")
                        const pot = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "potential")
                        return perf?.score && pot?.score && perf.score >= 70 && pot.score < 40
                      }).length}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Empty corner */}
              <div></div>
              
              {/* X-Axis Label */}
              <div className="col-span-3">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1 px-4">
                  <span>Bajo</span>
                  <span>Medio</span>
                  <span>Alto</span>
                </div>
                <div className="text-center">
                  <span className="text-sm font-semibold text-muted-foreground tracking-wider">DESEMPEÑO</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Recommendations */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="h-4 w-4 text-emerald-500" />
                Retener y Recompensar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">Colaboradores Estrella que necesitan planes de retención</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-emerald-600">
                  {staffList.filter(s => {
                    const perf = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "kpis")
                    const pot = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "potential")
                    return perf?.score && pot?.score && perf.score >= 70 && pot.score >= 70
                  }).length}
                </span>
                <span className="text-xs text-muted-foreground">colaboradores</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-blue-500" />
                Desarrollar Potencial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">Colaboradores con alto potencial que necesitan desarrollo</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-600">
                  {staffList.filter(s => {
                    const perf = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "kpis")
                    const pot = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "potential")
                    return perf?.score && pot?.score && pot.score >= 70 && perf.score < 70
                  }).length}
                </span>
                <span className="text-xs text-muted-foreground">colaboradores</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Plan de Mejora
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">Colaboradores que necesitan planes de mejora urgente</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-amber-600">
                  {staffList.filter(s => {
                    const perf = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "kpis")
                    const pot = staffEvaluations.find(e => e.staff_id === s.id && e.evaluation_type === "potential")
                    return perf?.score && pot?.score && perf.score < 40
                  }).length}
                </span>
                <span className="text-xs text-muted-foreground">colaboradores</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Climate Tab */}
      <TabsContent value="climate" className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Clima Laboral</h2>
            <p className="text-sm text-muted-foreground">Gestiona las encuestas de clima organizacional y satisfacción</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Encuesta
          </Button>
        </div>

        {/* Climate Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Satisfacción General</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-4xl font-bold text-green-600">78%</p>
                    <span className="text-xs text-green-600 flex items-center">
                      <ArrowUp className="h-3 w-3" />
                      +3%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">vs. periodo anterior</p>
                </div>
                <div className="h-16 w-16">
                  <svg viewBox="0 0 36 36" className="transform -rotate-90">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="3"
                      strokeDasharray="78, 100"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Compromiso</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-4xl font-bold text-blue-600">82%</p>
                    <span className="text-xs text-green-600 flex items-center">
                      <ArrowUp className="h-3 w-3" />
                      +5%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">eNPS: +45</p>
                </div>
                <div className="h-16 w-16">
                  <svg viewBox="0 0 36 36" className="transform -rotate-90">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeDasharray="82, 100"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Comunicación</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-4xl font-bold text-purple-600">71%</p>
                    <span className="text-xs text-amber-600 flex items-center">
                      <Minus className="h-3 w-3" />
                      0%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Área de mejora</p>
                </div>
                <div className="h-16 w-16">
                  <svg viewBox="0 0 36 36" className="transform -rotate-90">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="3"
                      strokeDasharray="71, 100"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Liderazgo</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-4xl font-bold text-amber-600">75%</p>
                    <span className="text-xs text-green-600 flex items-center">
                      <ArrowUp className="h-3 w-3" />
                      +2%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Confianza en líderes</p>
                </div>
                <div className="h-16 w-16">
                  <svg viewBox="0 0 36 36" className="transform -rotate-90">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3"
                      strokeDasharray="75, 100"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Climate Dimensions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dimensiones del Clima</CardTitle>
              <CardDescription>Resultados por área de evaluación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Ambiente de Trabajo", score: 85, color: "bg-emerald-500" },
                { name: "Desarrollo Profesional", score: 72, color: "bg-blue-500" },
                { name: "Balance Vida-Trabajo", score: 68, color: "bg-purple-500" },
                { name: "Reconocimiento", score: 65, color: "bg-amber-500" },
                { name: "Compensación", score: 58, color: "bg-orange-500" },
                { name: "Oportunidades de Crecimiento", score: 70, color: "bg-teal-500" },
              ].map((dim) => (
                <div key={dim.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{dim.name}</span>
                    <span className="font-semibold">{dim.score}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${dim.color} transition-all duration-500`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Clima por Departamento</CardTitle>
              <CardDescription>Comparativa entre áreas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { dept: "Tecnología", score: 82, employees: 45, trend: "up" },
                  { dept: "Ventas", score: 78, employees: 32, trend: "up" },
                  { dept: "Marketing", score: 85, employees: 18, trend: "up" },
                  { dept: "Operaciones", score: 71, employees: 56, trend: "down" },
                  { dept: "RRHH", score: 88, employees: 12, trend: "up" },
                  { dept: "Finanzas", score: 74, employees: 24, trend: "same" },
                ].map((item) => (
                  <div key={item.dept} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.dept}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{item.score}%</span>
                          {item.trend === "up" && <ArrowUp className="h-3 w-3 text-green-500" />}
                          {item.trend === "down" && <ArrowDown className="h-3 w-3 text-red-500" />}
                          {item.trend === "same" && <Minus className="h-3 w-3 text-gray-400" />}
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.score >= 80 ? "bg-emerald-500" : 
                            item.score >= 70 ? "bg-blue-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{item.employees} colaboradores</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Survey History & Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Historial de Encuestas</CardTitle>
                  <CardDescription>Encuestas realizadas y programadas</CardDescription>
                </div>
                <Button variant="outline" size="sm">Ver todas</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Encuesta Clima Q1 2024", date: "Mar 2024", status: "completed", participation: 94, score: 76 },
                  { name: "Pulso Mensual - Abril", date: "Abr 2024", status: "completed", participation: 87, score: 78 },
                  { name: "Pulso Mensual - Mayo", date: "May 2024", status: "active", participation: 62, score: null },
                  { name: "Encuesta Clima Q2 2024", date: "Jun 2024", status: "scheduled", participation: null, score: null },
                ].map((survey, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        survey.status === "completed" ? "bg-green-100" :
                        survey.status === "active" ? "bg-blue-100" : "bg-gray-100"
                      }`}>
                        {survey.status === "completed" ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : survey.status === "active" ? (
                          <Play className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Calendar className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{survey.name}</p>
                        <p className="text-xs text-muted-foreground">{survey.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {survey.participation !== null && (
                        <div className="text-right">
                          <p className="text-sm font-semibold">{survey.participation}%</p>
                          <p className="text-xs text-muted-foreground">Participación</p>
                        </div>
                      )}
                      {survey.score !== null && (
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-600">{survey.score}%</p>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                      )}
                      <Badge variant="outline" className={
                        survey.status === "completed" ? "bg-green-50 text-green-700 border-green-200" :
                        survey.status === "active" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-gray-50 text-gray-700 border-gray-200"
                      }>
                        {survey.status === "completed" ? "Completada" :
                         survey.status === "active" ? "Activa" : "Programada"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acciones Recomendadas</CardTitle>
              <CardDescription>Basadas en resultados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { title: "Mejorar comunicación interna", priority: "Alta", icon: MessageSquare, color: "text-red-500" },
                { title: "Programa de reconocimiento", priority: "Media", icon: Award, color: "text-amber-500" },
                { title: "Revisar compensaciones", priority: "Alta", icon: DollarSign, color: "text-red-500" },
                { title: "Capacitación líderes", priority: "Media", icon: GraduationCap, color: "text-amber-500" },
              ].map((action, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`mt-0.5 ${action.color}`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{action.title}</p>
                    <Badge variant="outline" className={`mt-1 text-[10px] ${
                      action.priority === "Alta" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      Prioridad {action.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      </Tabs>

      {/* Dialog: Nueva Evaluación */}
      <Dialog open={showNewEvaluationDialog} onOpenChange={setShowNewEvaluationDialog}>
        <DialogContent className="top-0 left-0 h-screen w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 sm:max-w-none overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Evaluación</DialogTitle>
            <DialogDescription>
              Crea una nueva evaluación para candidatos o colaboradores
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 mx-auto w-full max-w-3xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Evaluación</Label>
                <Select defaultValue="selection">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="selection">Selección</SelectItem>
                    <SelectItem value="permanence">Permanencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="psychometric">Psicométrico</SelectItem>
                    <SelectItem value="personality">Personalidad</SelectItem>
                    <SelectItem value="technical">Técnico</SelectItem>
                    <SelectItem value="medical">Médico</SelectItem>
                    <SelectItem value="360">360°</SelectItem>
                    <SelectItem value="kpi">KPIs</SelectItem>
                    <SelectItem value="competencies">Competencias</SelectItem>
                    <SelectItem value="climate">Clima Laboral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nombre de la Evaluación</Label>
              <Input placeholder="Ej: Evaluación Técnica - Frontend Developer" />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea placeholder="Descripción de la evaluación..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Inicio</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Vencimiento</Label>
                <Input type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Plantilla Base</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una plantilla (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {evaluationTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.questions} preguntas, {template.time} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewEvaluationDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setShowNewEvaluationDialog(false)}>
              Crear Evaluación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nuevo Objetivo */}
      <Dialog open={showNewObjectiveDialog} onOpenChange={setShowNewObjectiveDialog}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Nuevo Objetivo</DialogTitle>
            <DialogDescription>
              Define un objetivo para un colaborador y dale seguimiento durante el período
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="obj-title">Título del objetivo</Label>
              <Input
                id="obj-title"
                placeholder="Ej. Incrementar ventas en un 20%"
                value={newObjectiveForm.title}
                onChange={(e) => setNewObjectiveForm({ ...newObjectiveForm, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="obj-desc">Descripción</Label>
              <Textarea
                id="obj-desc"
                placeholder="Describe el objetivo y los resultados esperados..."
                value={newObjectiveForm.description}
                onChange={(e) => setNewObjectiveForm({ ...newObjectiveForm, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="obj-staff">Colaborador</Label>
              <Select
                value={newObjectiveForm.staffId}
                onValueChange={(v) => setNewObjectiveForm({ ...newObjectiveForm, staffId: v })}
              >
                <SelectTrigger id="obj-staff">
                  <SelectValue placeholder="Selecciona un colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="obj-period">Período</Label>
                <Input
                  id="obj-period"
                  placeholder="Ej. Q1 2026"
                  value={newObjectiveForm.period}
                  onChange={(e) => setNewObjectiveForm({ ...newObjectiveForm, period: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="obj-due">Fecha límite</Label>
                <Input
                  id="obj-due"
                  type="date"
                  value={newObjectiveForm.dueDate}
                  onChange={(e) => setNewObjectiveForm({ ...newObjectiveForm, dueDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewObjectiveDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateObjective}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Objetivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Seguimiento de Objetivo */}
      <Dialog open={showObjectiveFollowUpDialog} onOpenChange={setShowObjectiveFollowUpDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Seguimiento de Objetivo</DialogTitle>
            <DialogDescription>
              Registra el avance y comentarios de evaluación del objetivo
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fu-progress">Avance (%)</Label>
              <Input
                id="fu-progress"
                type="number"
                min={0}
                max={100}
                value={followUpForm.progress}
                onChange={(e) => setFollowUpForm({ ...followUpForm, progress: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fu-note">Comentario / Evaluación</Label>
              <Textarea
                id="fu-note"
                placeholder="Describe el avance, logros u obstáculos..."
                value={followUpForm.note}
                onChange={(e) => setFollowUpForm({ ...followUpForm, note: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowObjectiveFollowUpDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddFollowUp}>Guardar Seguimiento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Library Dialog */}
      <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
        <DialogContent className="top-0 left-0 h-screen w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 sm:max-w-none overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Biblioteca de Plantillas</DialogTitle>
            <DialogDescription>
              Plantillas predefinidas para evaluaciones
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mb-4">
            <Button
              variant={templateScopeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTemplateScopeFilter("all")}
            >
              Todas
            </Button>
            <Button
              variant={templateScopeFilter === "selection" ? "default" : "outline"}
              size="sm"
              onClick={() => setTemplateScopeFilter("selection")}
            >
              Selección
            </Button>
            <Button
              variant={templateScopeFilter === "permanence" ? "default" : "outline"}
              size="sm"
              onClick={() => setTemplateScopeFilter("permanence")}
            >
              Permanencia
            </Button>
            <Button
              variant={templateScopeFilter === "objectives" ? "default" : "outline"}
              size="sm"
              onClick={() => setTemplateScopeFilter("objectives")}
            >
              Objetivos
            </Button>
          </div>
          <div className="grid gap-3 py-4 mx-auto w-full max-w-4xl">
            {templatesList
              .filter(t => templateScopeFilter === "all" || t.scope === templateScopeFilter)
              .map((template) => {
              const config = categoryConfig[template.category] || categoryConfig.technical
              return (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${config.bgColor} ${config.color} flex items-center justify-center`}>
                      {config.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge variant="outline" className={
                          template.scope === "selection"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : template.scope === "objectives"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-purple-50 text-purple-700 border-purple-200"
                        }>
                          {template.scope === "selection" ? "Selección" : template.scope === "objectives" ? "Objetivos" : "Permanencia"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {template.questions} preguntas · {template.time} minutos
                      </p>
                    </div>
                  </div>
<div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handlePreviewTemplate(template)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Vista Previa
                      </Button>
                      <Button size="sm">
                        Usar
                      </Button>
                    </div>
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplatesDialog(false)}>
              Cerrar
            </Button>
            <Button onClick={handleOpenCreateTemplate}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Plantilla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="top-0 left-0 h-screen w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 sm:max-w-none overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate && categoryConfig[selectedTemplate.category] && (
                <div className={`w-8 h-8 rounded-lg ${categoryConfig[selectedTemplate.category].bgColor} ${categoryConfig[selectedTemplate.category].color} flex items-center justify-center`}>
                  {categoryConfig[selectedTemplate.category].icon}
                </div>
              )}
              {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-6 py-4">
              {/* Template Info */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedTemplate.questions} preguntas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedTemplate.time} minutos</span>
                </div>
                <Badge variant="secondary">
                  {categoryConfig[selectedTemplate.category]?.label || selectedTemplate.category}
                </Badge>
              </div>

              {/* Sample Questions */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Preguntas de Ejemplo
                </h4>
                <div className="space-y-4">
                  {selectedTemplate.sampleQuestions?.map((q, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium mb-2">{q.question}</p>
                          {q.type === "multiple" && q.options && (
                            <div className="space-y-2 ml-1">
                              {q.options.map((opt, i) => (
                                <label key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <div className="w-4 h-4 rounded-full border border-muted-foreground/30" />
                                  {opt}
                                </label>
                              ))}
                            </div>
                          )}
                          {q.type === "scale" && (
                            <div className="flex items-center gap-2 mt-2">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <div key={n} className="flex flex-col items-center gap-1">
                                  <div className="w-8 h-8 rounded-full border border-muted-foreground/30 flex items-center justify-center text-sm text-muted-foreground">
                                    {n}
                                  </div>
                                  {n === 1 && <span className="text-xs text-muted-foreground">Nunca</span>}
                                  {n === 5 && <span className="text-xs text-muted-foreground">Siempre</span>}
                                </div>
                              ))}
                            </div>
                          )}
                          {(q.type === "open" || q.type === "behavioral") && (
                            <Textarea 
                              placeholder="Escribe tu respuesta aquí..." 
                              className="mt-2" 
                              disabled 
                            />
                          )}
                          {q.type === "code" && (
                            <div className="mt-2 p-3 bg-zinc-900 rounded-lg">
                              <code className="text-sm text-zinc-300">// Escribe tu código aquí...</code>
                            </div>
                          )}
                          <Badge variant="outline" className="mt-2 text-xs">
                            {q.type === "multiple" && "Opción múltiple"}
                            {q.type === "scale" && "Escala 1-5"}
                            {q.type === "open" && "Respuesta abierta"}
                            {q.type === "behavioral" && "Pregunta conductual"}
                            {q.type === "code" && "Código"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Cerrar
            </Button>
            <Button onClick={() => {
              setShowPreviewDialog(false)
              // Aquí se podría abrir el diálogo de crear evaluación con la plantilla seleccionada
            }}>
              Usar esta Plantilla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={showCreateTemplateDialog} onOpenChange={setShowCreateTemplateDialog}>
        <DialogContent className="top-0 left-0 h-screen w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 sm:max-w-none overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nueva Plantilla</DialogTitle>
            <DialogDescription>
              Crea una nueva plantilla de evaluación con tus propias preguntas
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">Información General</TabsTrigger>
              <TabsTrigger value="questions">Preguntas ({newTemplateForm.sampleQuestions.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="new-template-name">Nombre de la Plantilla *</Label>
                <Input 
                  id="new-template-name"
                  value={newTemplateForm.name}
                  onChange={(e) => setNewTemplateForm({...newTemplateForm, name: e.target.value})}
                  placeholder="Ej: Evaluación de Ventas"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-template-description">Descripción</Label>
                <Textarea 
                  id="new-template-description"
                  value={newTemplateForm.description}
                  onChange={(e) => setNewTemplateForm({...newTemplateForm, description: e.target.value})}
                  placeholder="Describe el propósito y contenido de esta plantilla..."
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-template-category">Categoría</Label>
                <Select 
                  value={newTemplateForm.category} 
                  onValueChange={(v) => setNewTemplateForm({...newTemplateForm, category: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-template-scope">Aplicación</Label>
                <Select 
                  value={newTemplateForm.scope} 
                  onValueChange={(v: "selection" | "permanence" | "objectives") => setNewTemplateForm({...newTemplateForm, scope: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="selection">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>Selección</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="permanence">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        <span>Permanencia</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="objectives">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>Objetivos</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-template-questions">Número Total de Preguntas</Label>
                  <Input 
                    id="new-template-questions"
                    type="number"
                    value={newTemplateForm.questions}
                    onChange={(e) => setNewTemplateForm({...newTemplateForm, questions: parseInt(e.target.value) || 0})}
                    min={1}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-template-time">Tiempo Estimado (minutos)</Label>
                  <Input 
                    id="new-template-time"
                    type="number"
                    value={newTemplateForm.time}
                    onChange={(e) => setNewTemplateForm({...newTemplateForm, time: parseInt(e.target.value) || 0})}
                    min={1}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="questions" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Agrega las preguntas para tu plantilla
                </p>
                <Button size="sm" onClick={handleAddNewQuestion}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Pregunta
                </Button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {newTemplateForm.sampleQuestions.map((q, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-medium">
                            {index + 1}
                          </span>
                          <Select 
                            value={q.type} 
                            onValueChange={(v) => handleUpdateNewQuestion(index, "type", v)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple">Opción Múltiple</SelectItem>
                              <SelectItem value="scale">Escala 1-5</SelectItem>
                              <SelectItem value="open">Respuesta Abierta</SelectItem>
                              <SelectItem value="behavioral">Conductual</SelectItem>
                              <SelectItem value="code">Código</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveNewQuestion(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-2">
                        <Label>Pregunta</Label>
                        <Textarea 
                          value={q.question}
                          onChange={(e) => handleUpdateNewQuestion(index, "question", e.target.value)}
                          placeholder="Escribe la pregunta..."
                          rows={2}
                        />
                      </div>

                      {q.type === "multiple" && (
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <Label>Opciones de Respuesta</Label>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAddNewOption(index)}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Agregar
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {q.options?.map((opt, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full border flex items-center justify-center text-xs text-muted-foreground">
                                  {String.fromCharCode(65 + optIndex)}
                                </div>
                                <Input 
                                  value={opt}
                                  onChange={(e) => handleUpdateNewOption(index, optIndex, e.target.value)}
                                  placeholder={`Opción ${optIndex + 1}`}
                                  className="flex-1"
                                />
                                {q.options && q.options.length > 2 && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleRemoveNewOption(index, optIndex)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {q.type === "scale" && (
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm text-muted-foreground">Escala de respuesta:</span>
                          <Badge variant="secondary">1 - Nunca a 5 - Siempre</Badge>
                        </div>
                      )}

                      {q.type === "code" && (
                        <div className="grid gap-2">
                          <Label>Lenguaje de Programación</Label>
                          <Select 
                            value={q.language || "javascript"} 
                            onValueChange={(v) => handleUpdateNewQuestion(index, "language", v)}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="javascript">JavaScript</SelectItem>
                              <SelectItem value="python">Python</SelectItem>
                              <SelectItem value="java">Java</SelectItem>
                              <SelectItem value="csharp">C#</SelectItem>
                              <SelectItem value="sql">SQL</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {(q.type === "open" || q.type === "behavioral") && (
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm text-muted-foreground">
                            {q.type === "open" ? "Campo de texto libre para respuesta" : "Pregunta conductual con respuesta narrativa"}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}

                {newTemplateForm.sampleQuestions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay preguntas en esta plantilla</p>
                    <p className="text-sm">Haz clic en &quot;Agregar Pregunta&quot; para comenzar</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowCreateTemplateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTemplate} disabled={!newTemplateForm.name}>
              Crear Plantilla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={showEditTemplateDialog} onOpenChange={setShowEditTemplateDialog}>
        <DialogContent className="top-0 left-0 h-screen w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 sm:max-w-none overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Plantilla</DialogTitle>
            <DialogDescription>
              Modifica los detalles y preguntas de la plantilla de evaluación
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">Información General</TabsTrigger>
              <TabsTrigger value="questions">Preguntas ({editTemplateForm.sampleQuestions.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="template-name">Nombre de la Plantilla</Label>
                <Input 
                  id="template-name"
                  value={editTemplateForm.name}
                  onChange={(e) => setEditTemplateForm({...editTemplateForm, name: e.target.value})}
                  placeholder="Ej: Evaluación Técnica - Frontend"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="template-description">Descripción</Label>
                <Textarea 
                  id="template-description"
                  value={editTemplateForm.description}
                  onChange={(e) => setEditTemplateForm({...editTemplateForm, description: e.target.value})}
                  placeholder="Describe el propósito y contenido de esta plantilla..."
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="template-category">Categoría</Label>
                <Select 
                  value={editTemplateForm.category} 
                  onValueChange={(v) => setEditTemplateForm({...editTemplateForm, category: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="template-scope">Aplicación</Label>
                <Select 
                  value={editTemplateForm.scope || "selection"} 
                  onValueChange={(v: "selection" | "permanence" | "objectives") => setEditTemplateForm({...editTemplateForm, scope: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="selection">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>Selección</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="permanence">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        <span>Permanencia</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="objectives">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>Objetivos</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="template-questions">Número Total de Preguntas</Label>
                  <Input 
                    id="template-questions"
                    type="number"
                    value={editTemplateForm.questions}
                    onChange={(e) => setEditTemplateForm({...editTemplateForm, questions: parseInt(e.target.value) || 0})}
                    min={1}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="template-time">Tiempo Estimado (minutos)</Label>
                  <Input 
                    id="template-time"
                    type="number"
                    value={editTemplateForm.time}
                    onChange={(e) => setEditTemplateForm({...editTemplateForm, time: parseInt(e.target.value) || 0})}
                    min={1}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="questions" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Edita las preguntas de la plantilla
                </p>
                <Button size="sm" onClick={handleAddQuestion}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Pregunta
                </Button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {editTemplateForm.sampleQuestions.map((q, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-medium">
                            {index + 1}
                          </span>
                          <Select 
                            value={q.type} 
                            onValueChange={(v) => handleUpdateQuestion(index, "type", v)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple">Opción Múltiple</SelectItem>
                              <SelectItem value="scale">Escala 1-5</SelectItem>
                              <SelectItem value="open">Respuesta Abierta</SelectItem>
                              <SelectItem value="behavioral">Conductual</SelectItem>
                              <SelectItem value="code">Código</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveQuestion(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-2">
                        <Label>Pregunta</Label>
                        <Textarea 
                          value={q.question}
                          onChange={(e) => handleUpdateQuestion(index, "question", e.target.value)}
                          placeholder="Escribe la pregunta..."
                          rows={2}
                        />
                      </div>

                      {q.type === "multiple" && (
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <Label>Opciones de Respuesta</Label>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAddOption(index)}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Agregar
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {q.options?.map((opt, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full border flex items-center justify-center text-xs text-muted-foreground">
                                  {String.fromCharCode(65 + optIndex)}
                                </div>
                                <Input 
                                  value={opt}
                                  onChange={(e) => handleUpdateOption(index, optIndex, e.target.value)}
                                  placeholder={`Opción ${optIndex + 1}`}
                                  className="flex-1"
                                />
                                {q.options && q.options.length > 2 && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleRemoveOption(index, optIndex)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {q.type === "scale" && (
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm text-muted-foreground">Escala de respuesta:</span>
                          <Badge variant="secondary">1 - Nunca a 5 - Siempre</Badge>
                        </div>
                      )}

                      {q.type === "code" && (
                        <div className="grid gap-2">
                          <Label>Lenguaje de Programación</Label>
                          <Select 
                            value={q.language || "javascript"} 
                            onValueChange={(v) => handleUpdateQuestion(index, "language", v)}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="javascript">JavaScript</SelectItem>
                              <SelectItem value="python">Python</SelectItem>
                              <SelectItem value="java">Java</SelectItem>
                              <SelectItem value="csharp">C#</SelectItem>
                              <SelectItem value="sql">SQL</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {(q.type === "open" || q.type === "behavioral") && (
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm text-muted-foreground">
                            {q.type === "open" ? "Campo de texto libre para respuesta" : "Pregunta conductual con respuesta narrativa"}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}

                {editTemplateForm.sampleQuestions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay preguntas en esta plantilla</p>
                    <p className="text-sm">Haz clic en &quot;Agregar Pregunta&quot; para comenzar</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowEditTemplateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTemplate}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nuevo Candidato */}
      <Dialog open={showNewCandidateDialog} onOpenChange={setShowNewCandidateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Candidato</DialogTitle>
            <DialogDescription>
              Registra un nuevo candidato para evaluación de selección
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input
                  placeholder="Nombre"
                  value={newCandidateForm.first_name}
                  onChange={(e) => setNewCandidateForm({ ...newCandidateForm, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Apellido</label>
                <Input
                  placeholder="Apellido"
                  value={newCandidateForm.last_name}
                  onChange={(e) => setNewCandidateForm({ ...newCandidateForm, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Correo electrónico</label>
              <Input
                type="email"
                placeholder="correo@ejemplo.com"
                value={newCandidateForm.email}
                onChange={(e) => setNewCandidateForm({ ...newCandidateForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Teléfono</label>
              <Input
                placeholder="(000) 000-0000"
                value={newCandidateForm.phone}
                onChange={(e) => setNewCandidateForm({ ...newCandidateForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Puesto al que aplica</label>
              <Input
                placeholder="Ej: Asesor Inmobiliario"
                value={newCandidateForm.position}
                onChange={(e) => setNewCandidateForm({ ...newCandidateForm, position: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCandidateDialog(false)} disabled={savingCandidate}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCandidate} disabled={savingCandidate}>
              {savingCandidate ? "Guardando..." : "Registrar Candidato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Iniciar Evaluación de Candidato */}
      <Dialog open={showStartCandidateEvalDialog} onOpenChange={setShowStartCandidateEvalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Iniciar Evaluación de Selección</DialogTitle>
            <DialogDescription>
              Selecciona el candidato y la plantilla de evaluación a aplicar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Candidato</label>
              <Select
                value={candidateEvalForm.candidateId}
                onValueChange={(value) => setCandidateEvalForm({ ...candidateEvalForm, candidateId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un candidato" />
                </SelectTrigger>
                <SelectContent>
                  {candidatesList.filter(c => c.status === "pending").map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.first_name} {candidate.last_name} - {candidate.position_applied || "Sin puesto"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Plantilla de Evaluación</label>
              <Select
                value={candidateEvalForm.templateId}
                onValueChange={(value) => setCandidateEvalForm({ ...candidateEvalForm, templateId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una plantilla" />
                </SelectTrigger>
                <SelectContent>
                  {templatesList.filter(t => t.scope === "selection").map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.questions} preguntas)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartCandidateEvalDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={async () => {
              const candidate = candidatesList.find(c => c.id === candidateEvalForm.candidateId)
              if (!candidate) {
                alert("Por favor selecciona un candidato")
                return
              }
              // Update candidate status to in_progress
              const supabase = createClient()
              await supabase
                .from("candidates")
                .update({ status: "in_progress" })
                .eq("id", candidate.id)
              
              setCandidatesList(prev => prev.map(c => 
                c.id === candidate.id ? { ...c, status: "in_progress" } : c
              ))
              
              alert(`Evaluación iniciada para: ${candidate.first_name} ${candidate.last_name}`)
              setCandidateEvalForm({ candidateId: "", templateId: "" })
              setShowStartCandidateEvalDialog(false)
            }}>
              Iniciar Evaluación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Seleccionar Método de Evaluación */}
      <Dialog open={showEvalMethodDialog} onOpenChange={setShowEvalMethodDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Iniciar Evaluación</DialogTitle>
            <DialogDescription>
              {evalMethodData && (
                <>
                  Candidato: <strong>{evalMethodData.candidateName}</strong>
                  <br />
                  Tipo: <strong>
                    {evalMethodData.evalType === "psychometric" && "Psicométrica"}
                    {evalMethodData.evalType === "personality" && "Personalidad"}
                    {evalMethodData.evalType === "technical" && "Técnica"}
                    {evalMethodData.evalType === "medical" && "Médica"}
                  </strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!generatedLink ? (
              <div className="grid gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 justify-start"
                  onClick={handleGenerateEvalLink}
                >
                  <div className="flex items-start gap-3">
                    <Link2 className="h-5 w-5 mt-0.5 text-blue-500" />
                    <div className="text-left">
                      <div className="font-medium">Enviar enlace al candidato</div>
                      <div className="text-sm text-muted-foreground">
                        Genera un enlace único para que el candidato complete la evaluación de forma remota
                      </div>
                    </div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto p-4 justify-start"
                  onClick={handleStartInternalEval}
                >
                  <div className="flex items-start gap-3">
                    <ClipboardList className="h-5 w-5 mt-0.5 text-green-500" />
                    <div className="text-left">
                      <div className="font-medium">Aplicar presencialmente</div>
                      <div className="text-sm text-muted-foreground">
                        El reclutador aplica la evaluación y registra las respuestas del candidato
                      </div>
                    </div>
                  </div>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Enlace generado exitosamente</span>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Enlace de evaluación:</p>
                  <p className="text-sm font-mono break-all">{generatedLink}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLink)
                      alert("Enlace copiado al portapapeles")
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar enlace
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      const candidate = candidatesList.find(c => c.id === evalMethodData?.candidateId)
                      if (candidate?.email) {
                        window.open(`mailto:${candidate.email}?subject=Evaluación Pendiente&body=Hola ${candidate.first_name},%0A%0APor favor completa tu evaluación en el siguiente enlace:%0A%0A${encodeURIComponent(generatedLink)}%0A%0ASaludos`)
                      } else {
                        alert("El candidato no tiene correo registrado")
                      }
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar por correo
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  El enlace expira en 7 días
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEvalMethodDialog(false)
              setEvalMethodData(null)
              setGeneratedLink(null)
            }}>
              {generatedLink ? "Cerrar" : "Cancelar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Aplicar Evaluación Presencial */}
      <Dialog open={showApplyEvalDialog} onOpenChange={setShowApplyEvalDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Aplicar Evaluación - {evalMethodData?.candidateName}
            </DialogTitle>
            <DialogDescription>
              {evalMethodData && (
                <>
                  Tipo: {evalMethodData.evalType === "psychometric" && "Psicométrica"}
                  {evalMethodData.evalType === "personality" && "Personalidad"}
                  {evalMethodData.evalType === "technical" && "Técnica"}
                  {evalMethodData.evalType === "medical" && "Médica"}
                  {" • "}Pregunta {applyEvalCurrentQuestion + 1} de {applyEvalQuestions.length}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {applyEvalQuestions.length > 0 && (
              <>
                <Progress 
                  value={((applyEvalCurrentQuestion + 1) / applyEvalQuestions.length) * 100} 
                  className="mb-6 h-2" 
                />
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {applyEvalQuestions[applyEvalCurrentQuestion]?.question_text}
                  </h3>
                  <RadioGroup
                    value={applyEvalAnswers[applyEvalQuestions[applyEvalCurrentQuestion]?.id]?.toString() || ""}
                    onValueChange={(value) => {
                      const qId = applyEvalQuestions[applyEvalCurrentQuestion]?.id
                      setApplyEvalAnswers(prev => ({ ...prev, [qId]: parseInt(value) }))
                    }}
                    className="space-y-3"
                  >
                    {applyEvalQuestions[applyEvalCurrentQuestion]?.options?.map((option) => (
                      <div
                        key={option.value}
                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                          applyEvalAnswers[applyEvalQuestions[applyEvalCurrentQuestion]?.id] === option.value
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <RadioGroupItem value={option.value.toString()} id={`apply-option-${option.value}`} />
                        <Label htmlFor={`apply-option-${option.value}`} className="flex-1 cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div className="flex items-center justify-center gap-2 mt-6">
                  {applyEvalQuestions.map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => setApplyEvalCurrentQuestion(idx)}
                      className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                        idx === applyEvalCurrentQuestion
                          ? "bg-primary text-primary-foreground"
                          : applyEvalAnswers[q.id] !== undefined
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setApplyEvalCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={applyEvalCurrentQuestion === 0}
            >
              Anterior
            </Button>
            <div className="flex-1" />
            {applyEvalCurrentQuestion < applyEvalQuestions.length - 1 ? (
              <Button 
                onClick={() => setApplyEvalCurrentQuestion(prev => prev + 1)}
                disabled={applyEvalAnswers[applyEvalQuestions[applyEvalCurrentQuestion]?.id] === undefined}
              >
                Siguiente
              </Button>
            ) : (
              <Button 
                onClick={handleSubmitInternalEval}
                disabled={!applyEvalQuestions.every(q => applyEvalAnswers[q.id] !== undefined)}
              >
                Finalizar Evaluación
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Configurar Evaluación de Permanencia */}
      <Dialog open={showStaffEvalMethodDialog} onOpenChange={setShowStaffEvalMethodDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Evaluación</DialogTitle>
            <DialogDescription>
              {staffEvalMethodData && (
                <>
                  Colaborador: <strong>{staffEvalMethodData.staffName}</strong>
                  <br />
                  Tipo: <strong>
                    {staffEvalMethodData.evalType === "360" && "Evaluación 360°"}
                    {staffEvalMethodData.evalType === "kpis" && "Evaluación de KPIs"}
                    {staffEvalMethodData.evalType === "competencies" && "Evaluación de Competencias"}
                    {staffEvalMethodData.evalType === "potential" && "Evaluación de Potencial"}
                  </strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {staffEvalGeneratedLinks.length === 0 ? (
              <>
                {/* Template Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Plantilla de Evaluación</Label>
                  <Select value={staffEvalTemplate} onValueChange={setStaffEvalTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una plantilla" />
                    </SelectTrigger>
                    <SelectContent>
                      {templatesList
                        .filter(t => t.scope === "permanence")
                        .map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} ({t.questions || t.sampleQuestions?.length || 0} preguntas)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Evaluators for 360 */}
                {staffEvalMethodData?.evalType === "360" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Evaluadores</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddStaffEvaluator("supervisor")}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Supervisor
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddStaffEvaluator("peer")}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Par
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddStaffEvaluator("subordinate")}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Subordinado
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {staffEvalEvaluators.map((evaluator, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                          <Badge variant="outline" className="shrink-0">
                            {evaluator.type === "self" && "Auto"}
                            {evaluator.type === "supervisor" && "Supervisor"}
                            {evaluator.type === "peer" && "Par"}
                            {evaluator.type === "subordinate" && "Subordinado"}
                          </Badge>
                          <Input
                            placeholder="Nombre"
                            value={evaluator.name}
                            onChange={(e) => {
                              const newEvaluators = [...staffEvalEvaluators]
                              newEvaluators[index].name = e.target.value
                              setStaffEvalEvaluators(newEvaluators)
                            }}
                            disabled={evaluator.type === "self"}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Correo"
                            type="email"
                            value={evaluator.email}
                            onChange={(e) => {
                              const newEvaluators = [...staffEvalEvaluators]
                              newEvaluators[index].email = e.target.value
                              setStaffEvalEvaluators(newEvaluators)
                            }}
                            disabled={evaluator.type === "self"}
                            className="flex-1"
                          />
                          {evaluator.type !== "self" && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveStaffEvaluator(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Method Selection */}
                <div className="grid gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 justify-start"
                    onClick={handleGenerateStaffEvalLinks}
                    disabled={!staffEvalTemplate}
                  >
                    <div className="flex items-start gap-3">
                      <Link2 className="h-5 w-5 mt-0.5 text-blue-500" />
                      <div className="text-left">
                        <div className="font-medium">Enviar enlaces a evaluadores</div>
                        <div className="text-sm text-muted-foreground">
                          Genera enlaces únicos para que cada evaluador complete su evaluación de forma remota
                        </div>
                      </div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 justify-start"
                    onClick={handleStartInternalStaffEval}
                    disabled={!staffEvalTemplate}
                  >
                    <div className="flex items-start gap-3">
                      <ClipboardList className="h-5 w-5 mt-0.5 text-green-500" />
                      <div className="text-left">
                        <div className="font-medium">Aplicar presencialmente</div>
                        <div className="text-sm text-muted-foreground">
                          Aplicar la evaluación de forma presencial y registrar las respuestas directamente
                        </div>
                      </div>
                    </div>
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Enlaces generados exitosamente</span>
                </div>
                <div className="space-y-3">
                  {staffEvalGeneratedLinks.map((link, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge variant="outline">{link.type}</Badge>
                          <span className="ml-2 text-sm font-medium">{link.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(link.link)
                              alert("Enlace copiado al portapapeles")
                            }}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const evaluator = staffEvalEvaluators.find(e => e.name === link.name)
                              if (evaluator?.email) {
                                window.open(`mailto:${evaluator.email}?subject=Evaluación de Desempeño Pendiente&body=Hola ${link.name},%0A%0APor favor completa la evaluación en el siguiente enlace:%0A%0A${encodeURIComponent(link.link)}%0A%0ASaludos`)
                              }
                            }}
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            Enviar
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono break-all">{link.link}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Los enlaces expiran en 14 días
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowStaffEvalMethodDialog(false)
              setStaffEvalMethodData(null)
              setStaffEvalGeneratedLinks([])
            }}>
              {staffEvalGeneratedLinks.length > 0 ? "Cerrar" : "Cancelar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Aplicar Evaluación de Permanencia Presencial */}
      <Dialog open={showStaffApplyEvalDialog} onOpenChange={setShowStaffApplyEvalDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Aplicar Evaluación - {staffEvalMethodData?.staffName}
            </DialogTitle>
            <DialogDescription>
              {staffApplyEvalData && (
                <>
                  {staffApplyEvalData.template.name}
                  {" • "}Pregunta {staffApplyEvalCurrentQuestion + 1} de {staffApplyEvalData.template.questions.length}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {staffApplyEvalData && (
              <>
                <Progress 
                  value={((staffApplyEvalCurrentQuestion + 1) / staffApplyEvalData.template.questions.length) * 100} 
                  className="mb-6 h-2" 
                />
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {staffApplyEvalData.template.questions[staffApplyEvalCurrentQuestion]?.category}
                  </div>
                  <h3 className="text-lg font-medium">
                    {staffApplyEvalData.template.questions[staffApplyEvalCurrentQuestion]?.text}
                  </h3>
                  <RadioGroup
                    value={staffApplyEvalAnswers[staffApplyEvalCurrentQuestion]?.toString() || ""}
                    onValueChange={(value) => {
                      setStaffApplyEvalAnswers(prev => ({ ...prev, [staffApplyEvalCurrentQuestion]: parseInt(value) }))
                    }}
                    className="space-y-3"
                  >
                    {staffApplyEvalData.template.scale.map((option) => (
                      <div
                        key={option.value}
                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                          staffApplyEvalAnswers[staffApplyEvalCurrentQuestion] === option.value
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <RadioGroupItem value={option.value.toString()} id={`staff-apply-option-${option.value}`} />
                        <Label htmlFor={`staff-apply-option-${option.value}`} className="flex-1 cursor-pointer">
                          <span className="font-medium mr-2">{option.value}.</span>
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                  {staffApplyEvalData.template.questions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setStaffApplyEvalCurrentQuestion(idx)}
                      className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                        idx === staffApplyEvalCurrentQuestion
                          ? "bg-primary text-primary-foreground"
                          : staffApplyEvalAnswers[idx] !== undefined
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setStaffApplyEvalCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={staffApplyEvalCurrentQuestion === 0}
            >
              Anterior
            </Button>
            <div className="flex-1" />
            {staffApplyEvalData && staffApplyEvalCurrentQuestion < staffApplyEvalData.template.questions.length - 1 ? (
              <Button 
                onClick={() => setStaffApplyEvalCurrentQuestion(prev => prev + 1)}
                disabled={staffApplyEvalAnswers[staffApplyEvalCurrentQuestion] === undefined}
              >
                Siguiente
              </Button>
            ) : (
              <Button 
                onClick={handleSubmitInternalStaffEval}
                disabled={!staffApplyEvalData || !staffApplyEvalData.template.questions.every((_, idx) => staffApplyEvalAnswers[idx] !== undefined)}
              >
                Finalizar Evaluación
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Iniciar Evaluación de Permanencia */}
      <Dialog open={showStartPermanenceEvalDialog} onOpenChange={setShowStartPermanenceEvalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Iniciar Evaluación de Permanencia</DialogTitle>
            <DialogDescription>
              Selecciona el colaborador y tipo de evaluación a realizar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Colaborador</label>
              <Select
                value={permanenceEvalForm.collaboratorId}
                onValueChange={(value) => setPermanenceEvalForm({ ...permanenceEvalForm, collaboratorId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.first_name} {staff.last_name} - {staff.position_rel?.name || staff.position || "Sin puesto"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Evaluación</label>
              <Select
                value={permanenceEvalForm.evaluationType}
                onValueChange={(value) => setPermanenceEvalForm({ ...permanenceEvalForm, evaluationType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo de evaluación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="360">Evaluación 360°</SelectItem>
                  <SelectItem value="kpis">Evaluación de KPIs</SelectItem>
                  <SelectItem value="competencies">Evaluación de Competencias</SelectItem>
                  <SelectItem value="potential">Evaluación de Potencial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartPermanenceEvalDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              // TODO: Iniciar evaluación en base de datos
              const staff = staffList.find(s => s.id === permanenceEvalForm.collaboratorId)
              alert("Evaluación iniciada para: " + (staff ? `${staff.first_name} ${staff.last_name}` : "Selecciona un colaborador"))
              setPermanenceEvalForm({ collaboratorId: "", evaluationType: "360" })
              setShowStartPermanenceEvalDialog(false)
            }}>
              Iniciar Evaluación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Reenviar Link de Evaluación */}
      <Dialog open={showResendEvalDialog} onOpenChange={setShowResendEvalDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-blue-600" />
              Reenviar Link de Evaluación
            </DialogTitle>
            <DialogDescription>
              Genera un nuevo link para la evaluación en proceso sin perder el avance actual
            </DialogDescription>
          </DialogHeader>
          {resendEvalData && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Evaluado:</span>
                  <span className="font-medium">{resendEvalData.personName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="font-medium">{resendEvalData.personEmail}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tipo de Evaluación:</span>
                  <Badge variant="outline" className="capitalize">
                    {resendEvalData.evalType === "psychometric" ? "Psicométrica" :
                     resendEvalData.evalType === "personality" ? "Personalidad" :
                     resendEvalData.evalType === "technical" ? "Técnica" :
                     resendEvalData.evalType === "360" ? "360°" :
                     resendEvalData.evalType === "kpis" ? "KPIs" :
                     resendEvalData.evalType === "competencies" ? "Competencias" :
                     resendEvalData.evalType === "potential" ? "Potencial" :
                     resendEvalData.evalType}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Estado:</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">En proceso</Badge>
                </div>
              </div>

              {resendEvalData.currentLink && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Link Actual</label>
                  <div className="flex gap-2">
                    <Input 
                      value={resendEvalData.currentLink} 
                      readOnly 
                      className="bg-muted text-xs"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleCopyEvalLink(resendEvalData.currentLink)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Nota importante:</p>
                    <p>Al generar un nuevo link, el link anterior dejará de funcionar. El avance de la evaluación se mantendrá intacto.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowResendEvalDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleResendEvaluation}
              disabled={resendingEval}
              className="gap-2"
            >
              {resendingEval ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Generar Nuevo Link
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Reiniciar Evaluación Completa */}
      <Dialog open={showRestartEvalDialog} onOpenChange={setShowRestartEvalDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-amber-600" />
              Reiniciar Evaluación
            </DialogTitle>
            <DialogDescription>
              Reinicia la evaluación desde cero. Todo el avance y respuestas anteriores serán eliminados.
            </DialogDescription>
          </DialogHeader>
          {restartEvalData && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Evaluado:</span>
                  <span className="font-medium">{restartEvalData.personName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="font-medium">{restartEvalData.personEmail}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tipo de Evaluación:</span>
                  <Badge variant="outline" className="capitalize">
                    {restartEvalData.evalType === "psychometric" ? "Psicométrica" :
                     restartEvalData.evalType === "personality" ? "Personalidad" :
                     restartEvalData.evalType === "technical" ? "Técnica" :
                     restartEvalData.evalType === "360" ? "360°" :
                     restartEvalData.evalType === "kpis" ? "KPIs" :
                     restartEvalData.evalType === "competencies" ? "Competencias" :
                     restartEvalData.evalType === "potential" ? "Potencial" :
                     restartEvalData.evalType}
                  </Badge>
                </div>
                {restartEvalData.currentEvaluatorName && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Evaluador Actual:</span>
                    <span className="font-medium">{restartEvalData.currentEvaluatorName}</span>
                  </div>
                )}
              </div>

              {/* Opción de cambiar evaluador */}
              {restartEvalData.type === "candidate" && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="keep-evaluator"
                      checked={restartEvalKeepEvaluator}
                      onCheckedChange={(checked) => setRestartEvalKeepEvaluator(checked as boolean)}
                    />
                    <label htmlFor="keep-evaluator" className="text-sm font-medium cursor-pointer">
                      Mantener el mismo evaluador
                    </label>
                  </div>
                  
                  {!restartEvalKeepEvaluator && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nuevo Evaluador</label>
                      <Select
                        value={restartEvalNewEvaluatorId}
                        onValueChange={setRestartEvalNewEvaluatorId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar nuevo evaluador" />
                        </SelectTrigger>
                        <SelectContent>
                          {staffList.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.first_name} {s.last_name} - {s.position || "Sin puesto"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Advertencia:</p>
                    <p>Esta acción eliminará permanentemente todas las respuestas y el progreso de la evaluación. Se generará un nuevo link y la evaluación quedará en estado pendiente.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => {
              setShowRestartEvalDialog(false)
              setRestartEvalData(null)
              setRestartEvalNewEvaluatorId("")
              setRestartEvalKeepEvaluator(true)
            }}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRestartEvaluation}
              disabled={restartingEval || (!restartEvalKeepEvaluator && !restartEvalNewEvaluatorId)}
              className="gap-2"
            >
              {restartingEval ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Reiniciando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Reiniciar Evaluación
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
