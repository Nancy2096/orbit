"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Building2, Lock, Mail, Eye, EyeOff } from "lucide-react"
import { useSystemBranding } from "@/hooks/use-system-branding"

export default function LoginPage() {
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { branding, getLogoUrl } = useSystemBranding()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message === "Invalid login credentials" 
        ? "Credenciales inválidas. Verifica tu correo y contraseña."
        : error.message)
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#5dade2]">
        <div className="flex flex-col items-center gap-4">
          {branding.logo_url ? (
            <div className="w-24 h-24 flex items-center justify-center">
              <img 
                src={getLogoUrl(branding.logo_url) || ""} 
                alt={branding.system_name}
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm text-white">
              <Building2 className="w-10 h-10" />
            </div>
          )}
          <Spinner className="h-6 w-6 text-white" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#5dade2] p-6">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Left Side - Logo Only */}
          <div className="flex items-center justify-center md:flex-1">
            {branding.logo_url ? (
              <div className="relative w-52 h-52 md:w-60 md:h-60 flex items-center justify-center">
                {/* White radial gradient background - diffused from center outwards */}
                <div 
                  className="absolute -inset-10 md:-inset-12 rounded-full blur-2xl"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.3) 60%, rgba(255,255,255,0) 100%)'
                  }}
                />
                <img 
                  src={getLogoUrl(branding.logo_url) || ""} 
                  alt={branding.system_name}
                  className="relative z-10 w-4/5 h-4/5 object-contain drop-shadow-2xl"
                />
              </div>
            ) : (
              <div className="relative w-40 h-40 md:w-52 md:h-52 flex items-center justify-center">
                {/* White radial gradient background - diffused from center outwards */}
                <div 
                  className="absolute -inset-8 md:-inset-10 rounded-full blur-2xl"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.3) 60%, rgba(255,255,255,0) 100%)'
                  }}
                />
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                  <Building2 className="w-20 h-20 md:w-24 md:h-24 text-[#2980b9]" />
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Name + Login Form */}
          <div className="w-full md:flex-1 max-w-sm space-y-4">
            {/* System Name and Tagline */}
            <div className="text-center md:text-left mb-2">
              {branding.logo_name_url ? (
                <div className="mb-2">
                  <img 
                    src={getLogoUrl(branding.logo_name_url) || ""} 
                    alt={branding.system_name}
                    className="h-12 md:h-14 object-contain drop-shadow-lg mx-auto md:mx-0"
                  />
                </div>
              ) : (
                <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                  {branding.system_name}
                </h1>
              )}
              <p className="text-white/80 mt-1 text-sm tracking-wide uppercase">
                {branding.tagline}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <Input
                  type="email"
                  placeholder="Usuario"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-12 bg-white/95 border-0 rounded-lg text-gray-700 placeholder:text-gray-400 shadow-lg focus:ring-2 focus:ring-white/50"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-12 pr-12 bg-white/95 border-0 rounded-lg text-gray-700 placeholder:text-gray-400 shadow-lg focus:ring-2 focus:ring-white/50"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/20 backdrop-blur-sm text-white text-sm text-center">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl border-0"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner className="mr-2 h-5 w-5" />
                    Ingresando...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-white/70">¿No tienes cuenta? </span>
              <Link href="/auth/signup" className="text-white hover:underline font-medium">
                Regístrate aquí
              </Link>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-white/50 mt-4">
              Sistema de gestión integral para agencias
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
