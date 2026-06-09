import { OrbitTasksFlowLayout } from "@/components/orbit-tasksflow/orbit-layout"

export default function OrbitTasksFlowMainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <OrbitTasksFlowLayout>{children}</OrbitTasksFlowLayout>
}
