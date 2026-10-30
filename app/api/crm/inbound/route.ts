import { handleInboundLead } from "@/lib/crm/inbound-lead"

// Misma captura de leads que /api/crm/inbound/[token], con el token solo en
// Authorization: Bearer <token> para que no quede en la URL ni en los logs.
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  return handleInboundLead(request)
}
