import { auth } from "@/auth"
import { NextResponse } from "next/server"

const CALENDAR_API = "https://www.googleapis.com/calendar/v3"

export async function GET() {
  const session = await auth()
  // @ts-expect-error — campo custom
  const accessToken = session?.access_token
  if (!accessToken) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const params = new URLSearchParams({
    timeMin: new Date().toISOString(),
    maxResults: "20",
    singleEvents: "true",
    orderBy: "startTime",
  })

  const res = await fetch(
    `${CALENDAR_API}/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const data = await res.json()
  if (!res.ok) return NextResponse.json(data, { status: res.status })
  return NextResponse.json(data.items)
}

export async function POST(request: Request) {
  const session = await auth()
  // @ts-expect-error — campo custom
  const accessToken = session?.access_token
  if (!accessToken) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const body = await request.json()

  const evento = {
    summary: body.titulo,
    description: body.descripcion ?? "",
    start: { dateTime: body.inicio, timeZone: "America/Mexico_City" },
    end: { dateTime: body.fin, timeZone: "America/Mexico_City" },
    attendees: (body.invitados ?? []).map((email: string) => ({ email })),
    reminders: { useDefault: true },
  }

  const res = await fetch(
    `${CALENDAR_API}/calendars/primary/events?sendUpdates=all`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(evento),
    }
  )
  const data = await res.json()
  if (!res.ok) return NextResponse.json(data, { status: res.status })

  return NextResponse.json({
    id: data.id,
    link: data.htmlLink,
    meet: data.hangoutLink ?? null,
  })
}
