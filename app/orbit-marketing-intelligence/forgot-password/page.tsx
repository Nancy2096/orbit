"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Loader2, ArrowLeft, CheckCircle } from "lucide-react"

export default function OMIForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsLoading(false)
    setIsSent(true)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Orbit</h1>
              <p className="text-sm text-white/80">Marketing Intelligence</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold leading-tight mb-6">
            Recupera tu acceso<br />
            en segundos
          </h2>
          
          <p className="text-lg text-white/80 mb-8 max-w-md">
            Te enviaremos un enlace seguro para que puedas restablecer tu contraseña.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4 lg:hidden">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-700">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl">
                {isSent ? "Correo Enviado" : "Recuperar Contraseña"}
              </CardTitle>
              <CardDescription>
                {isSent 
                  ? "Revisa tu bandeja de entrada" 
                  : "Ingresa tu correo electrónico"
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-4">
              {isSent ? (
                <div className="text-center py-6">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Hemos enviado un enlace de recuperación a <strong>{email}</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    El enlace expirará en 24 horas
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar enlace de recuperación
                  </Button>
                </form>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-center">
              <Link 
                href="/orbit-marketing-intelligence/login" 
                className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio de sesión
              </Link>
            </CardFooter>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-8">
            © 2026 Orbit Marketing Intelligence. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
