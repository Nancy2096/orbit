// Fuente de verdad compartida para las cuentas/proyectos de Orbit TasksFlow.
// La usan tanto el menú lateral (orbit-layout) como el detalle de proyecto,
// para que al seleccionar una cuenta se muestren sus datos y tareas propias.

export interface ProjectTask {
  id: string
  title: string
  status: "completado" | "en_progreso" | "pendiente" | "vencido"
  priority: "alta" | "media" | "baja"
  assignee: string
  assigneeName: string
  dueDate: string
  createdAt: string
  hours: number
  description: string
}

export interface ProjectSummary {
  id: string
  name: string
  client: string
  account: string
  tasks: ProjectTask[]
}

export const projectsData: ProjectSummary[] = [
  {
    id: "1",
    name: "Campaña Leads Q2",
    client: "Desarrolladora Horizonte",
    account: "Horizonte Residencial",
    tasks: [
      { id: "1-1", title: "Diseñar artes campaña leads", status: "en_progreso", priority: "alta", assignee: "DG", assigneeName: "Diana García", dueDate: "2026-05-12", createdAt: "2026-05-01", hours: 4.5, description: "Piezas gráficas para captación de leads" },
      { id: "1-2", title: "Configurar Meta Ads", status: "pendiente", priority: "alta", assignee: "EM", assigneeName: "Eduardo Méndez", dueDate: "2026-05-11", createdAt: "2026-05-02", hours: 3, description: "Setup de audiencias y presupuestos en Meta Ads" },
      { id: "1-3", title: "Configurar Google Ads", status: "pendiente", priority: "media", assignee: "EM", assigneeName: "Eduardo Méndez", dueDate: "2026-05-18", createdAt: "2026-05-03", hours: 3, description: "Campañas de búsqueda para leads" },
      { id: "1-4", title: "Análisis de métricas semanales", status: "en_progreso", priority: "media", assignee: "MG", assigneeName: "María García", dueDate: "2026-05-20", createdAt: "2026-05-04", hours: 2, description: "Dashboard de performance de la campaña" },
    ],
  },
  {
    id: "2",
    name: "Landing Torre Central",
    client: "Torre Central Living",
    account: "Torre Central",
    tasks: [
      { id: "2-1", title: "Revisar copies landing", status: "en_progreso", priority: "media", assignee: "ML", assigneeName: "María López", dueDate: "2026-05-13", createdAt: "2026-05-02", hours: 2, description: "Ajuste de textos de la landing page" },
      { id: "2-2", title: "Subir cambios a web", status: "vencido", priority: "alta", assignee: "CR", assigneeName: "Carlos Ruiz", dueDate: "2026-05-10", createdAt: "2026-05-01", hours: 3, description: "Deploy de cambios solicitados por el cliente" },
      { id: "2-3", title: "Optimizar velocidad de carga", status: "pendiente", priority: "media", assignee: "CR", assigneeName: "Carlos Ruiz", dueDate: "2026-05-19", createdAt: "2026-05-05", hours: 5, description: "Mejorar Core Web Vitals de la landing" },
    ],
  },
  {
    id: "3",
    name: "Branding Residencial",
    client: "Residencial Bosques",
    account: "Bosques",
    tasks: [
      { id: "3-1", title: "Calendario redes mayo", status: "en_progreso", priority: "alta", assignee: "LV", assigneeName: "Laura Vega", dueDate: "2026-05-14", createdAt: "2026-05-01", hours: 5, description: "Parrilla de contenidos para redes sociales" },
      { id: "3-2", title: "Video promocional", status: "en_progreso", priority: "alta", assignee: "PM", assigneeName: "Pedro Martínez", dueDate: "2026-05-16", createdAt: "2026-05-03", hours: 8, description: "Video promocional del residencial" },
      { id: "3-3", title: "Diseño logo nuevo", status: "pendiente", priority: "alta", assignee: "DG", assigneeName: "Diana García", dueDate: "2026-05-20", createdAt: "2026-05-06", hours: 6, description: "Propuesta de identidad visual" },
      { id: "3-4", title: "Manual de marca", status: "pendiente", priority: "media", assignee: "ML", assigneeName: "María López", dueDate: "2026-05-25", createdAt: "2026-05-07", hours: 10, description: "Documento con lineamientos de marca" },
    ],
  },
  {
    id: "4",
    name: "SEO Mensual Mayo",
    client: "Grupo Inmobiliario Altiva",
    account: "Altiva",
    tasks: [
      { id: "4-1", title: "Reporte mensual abril", status: "completado", priority: "media", assignee: "AT", assigneeName: "Ana Torres", dueDate: "2026-05-05", createdAt: "2026-04-28", hours: 3, description: "Reporte de posicionamiento del mes anterior" },
      { id: "4-2", title: "Auditoría de keywords", status: "en_progreso", priority: "alta", assignee: "AT", assigneeName: "Ana Torres", dueDate: "2026-05-15", createdAt: "2026-05-02", hours: 6, description: "Revisión y actualización de keywords objetivo" },
      { id: "4-3", title: "Optimización on-page", status: "pendiente", priority: "media", assignee: "CR", assigneeName: "Carlos Ruiz", dueDate: "2026-05-22", createdAt: "2026-05-05", hours: 8, description: "Mejoras de contenido y metadatos" },
    ],
  },
  {
    id: "5",
    name: "Renders 3D",
    client: "Nova Arquitectura",
    account: "Nova",
    tasks: [
      { id: "5-1", title: "Render exterior torre", status: "vencido", priority: "alta", assignee: "RS", assigneeName: "Roberto Sánchez", dueDate: "2026-05-08", createdAt: "2026-04-30", hours: 12, description: "Render fotorrealista del exterior" },
      { id: "5-2", title: "Render lobby", status: "en_progreso", priority: "alta", assignee: "RS", assigneeName: "Roberto Sánchez", dueDate: "2026-05-17", createdAt: "2026-05-04", hours: 10, description: "Render del lobby principal" },
      { id: "5-3", title: "Recorrido virtual", status: "pendiente", priority: "media", assignee: "PM", assigneeName: "Pedro Martínez", dueDate: "2026-05-28", createdAt: "2026-05-08", hours: 20, description: "Tour virtual 360 del desarrollo" },
    ],
  },
  {
    id: "6",
    name: "Campaña Meta Ads Abril",
    client: "Desarrolladora Horizonte",
    account: "Horizonte Comercial",
    tasks: [
      { id: "6-1", title: "Cierre de campaña abril", status: "completado", priority: "media", assignee: "EM", assigneeName: "Eduardo Méndez", dueDate: "2026-05-02", createdAt: "2026-04-25", hours: 2, description: "Reporte final de resultados de abril" },
      { id: "6-2", title: "Optimización de pauta", status: "en_progreso", priority: "alta", assignee: "JP", assigneeName: "Juan Pérez", dueDate: "2026-05-12", createdAt: "2026-05-03", hours: 4, description: "Ajuste de presupuestos según rendimiento" },
      { id: "6-3", title: "Nuevos creativos", status: "pendiente", priority: "media", assignee: "DG", assigneeName: "Diana García", dueDate: "2026-05-21", createdAt: "2026-05-06", hours: 6, description: "Set de creativos para la siguiente fase" },
    ],
  },
]

export function getProjectSummary(id: string): ProjectSummary | undefined {
  return projectsData.find((p) => p.id === id)
}
