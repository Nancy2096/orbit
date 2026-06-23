import { google } from "googleapis"

// Scopes solicitados al usuario: enviar correos (Gmail) y gestionar el calendario.
export const GOOGLE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar.events",
]

export function getRedirectUri(origin: string): string {
  // Permite sobrescribir mediante variable de entorno; por defecto usa el origen actual.
  return process.env.GOOGLE_REDIRECT_URI || `${origin}/api/google/callback`
}

export function getOAuthClient(origin: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET no están configurados")
  }

  return new google.auth.OAuth2(clientId, clientSecret, getRedirectUri(origin))
}

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}
