import { handleInboundLead } from "@/lib/crm/inbound-lead"

// Endpoint público de captura de leads (Meta Lead Ads, Google Lead Forms, Zapier
// y la página web). El token de la agencia va en la URL o en Authorization: Bearer.
export const dynamic = "force-dynamic"

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return handleInboundLead(request, token)
}
