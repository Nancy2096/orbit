import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

const ALLOWED_DOMAIN = "agency4realestate.com"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.events",
          access_type: "offline",
          prompt: "consent",
          hd: ALLOWED_DOMAIN,
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      return profile?.email?.endsWith(`@${ALLOWED_DOMAIN}`) ?? false
    },
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expires_at: account.expires_at,
        }
      }
      if (Date.now() < (token.expires_at as number) * 1000) {
        return token
      }
      try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.AUTH_GOOGLE_ID!,
            client_secret: process.env.AUTH_GOOGLE_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refresh_token as string,
          }),
        })
        const refreshed = await response.json()
        if (!response.ok) throw refreshed
        return {
          ...token,
          access_token: refreshed.access_token,
          expires_at: Math.floor(Date.now() / 1000 + refreshed.expires_in),
          refresh_token: refreshed.refresh_token ?? token.refresh_token,
        }
      } catch (error) {
        console.error("Error renovando token de Google", error)
        return { ...token, error: "RefreshTokenError" }
      }
    },
    async session({ session, token }) {
      // @ts-expect-error — campo custom
      session.access_token = token.access_token
      // @ts-expect-error — campo custom
      session.error = token.error
      return session
    },
  },
})
