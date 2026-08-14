import { ThemeProvider } from "@/components/theme-provider"

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
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <div className="min-h-screen bg-background text-foreground">
        {children}
      </div>
    </ThemeProvider>
  )
}
