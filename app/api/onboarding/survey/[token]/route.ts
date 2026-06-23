import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { SURVEY_QUESTIONS } from "@/lib/onboarding"

// GET: obtener la encuesta por token (público, sin auth)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const supabase = await createClient()

  const { data: survey, error } = await supabase
    .from("onboarding_surveys")
    .select("id, moment, status, scheduled_date, completed_at, responses, process_id")
    .eq("token", token)
    .single()

  if (error || !survey) {
    return NextResponse.json({ error: "Encuesta no encontrada" }, { status: 404 })
  }

  // Obtener el nombre del colaborador para personalizar la encuesta
  let collaboratorName: string | null = null
  const { data: process } = await supabase
    .from("onboarding_processes")
    .select("staff:staff_id(first_name, last_name)")
    .eq("id", survey.process_id)
    .single()

  if (process?.staff) {
    const s = process.staff as unknown as { first_name: string; last_name: string }
    collaboratorName = `${s.first_name} ${s.last_name}`.trim()
  }

  return NextResponse.json({
    survey: {
      id: survey.id,
      moment: survey.moment,
      status: survey.status,
      scheduled_date: survey.scheduled_date,
      completed_at: survey.completed_at,
      responses: survey.responses,
    },
    questions: SURVEY_QUESTIONS,
    collaboratorName,
  })
}

// POST: enviar respuestas de la encuesta (público, sin auth)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const supabase = await createClient()

  const body = await req.json()
  const responses = body?.responses

  if (!responses || typeof responses !== "object") {
    return NextResponse.json({ error: "Respuestas inválidas" }, { status: 400 })
  }

  const { data: survey, error: findError } = await supabase
    .from("onboarding_surveys")
    .select("id, status")
    .eq("token", token)
    .single()

  if (findError || !survey) {
    return NextResponse.json({ error: "Encuesta no encontrada" }, { status: 404 })
  }

  if (survey.status === "completed") {
    return NextResponse.json({ error: "Esta encuesta ya fue respondida" }, { status: 409 })
  }

  const { error: updateError } = await supabase
    .from("onboarding_surveys")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      responses,
    })
    .eq("id", survey.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
