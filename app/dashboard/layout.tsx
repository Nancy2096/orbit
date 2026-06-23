import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SystemThemeProvider } from "@/components/system-theme-provider"
import { PermissionsProvider } from "@/components/dashboard/permissions-provider"
import { RouteGuard } from "@/components/dashboard/route-guard"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || ""
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from("users")
    .select(`
      *,
      role:roles(*)
    `)
    .eq("id", user.id)
    .single()

  // Check if we're in marketing-intelligence section - if so, just render children
  // Marketing Intelligence has its own complete layout via MILayout
  const isMarketingIntelligence = pathname.includes("/marketing-intelligence")
  
  if (isMarketingIntelligence) {
    return (
      <SystemThemeProvider>
        {children}
      </SystemThemeProvider>
    )
  }

  return (
    <SystemThemeProvider>
      <PermissionsProvider>
        <SidebarProvider>
          <DashboardSidebar user={profile} />
          <SidebarInset>
            <DashboardHeader user={profile} />
            <main className="flex-1 p-6">
              <RouteGuard>{children}</RouteGuard>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </PermissionsProvider>
    </SystemThemeProvider>
  )
}
