export const metadata = {
  title: "Orbit TasksFlow",
  description: "Gestión de tareas, proyectos y cuentas.",
}

export default function OrbitTasksFlowRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
