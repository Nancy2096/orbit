import { MILayout } from "@/components/marketing-intelligence/mi-layout"

export default function MarketingIntelligenceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MILayout>{children}</MILayout>
}
