"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Layers, ArrowLeft, Mail, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simulated password reset - replace with actual implementation
    setTimeout(() => {
      if (email) {
        setIsSubmitted(true)
      } else {
        setError("Por favor ingrese su correo electrónico")
      }
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Layers className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Orbit</h1>
              <p className="text-white/70 text-sm">TasksFlow</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Recupera el acceso<br />a tu cuenta
          </h2>
          <p className="text-white/80 text-lg max-w-md">
            Te enviaremos un enlace seguro a tu correo electrónico para restablecer tu contraseña.
          </p>
        </div>

        <p className="text-white/50 text-sm">
          © 2026 Orbit TasksFlow. Todos los derechos reservados.
        </p>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Orbit TasksFlow</h1>
            </div>
          </div>

          <Card className="border-0 shadow-lg">
            {!isSubmitted ? (
              <>
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-2xl font-bold">Recuperar Contraseña</CardTitle>
                  <CardDescription>
                    Ingresa tu correo electrónico y te enviaremos instrucciones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                        {error}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="nombre@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        "Enviando..."
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Enviar Instrucciones
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader className="space-y-1 pb-4 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Correo Enviado</CardTitle>
                  <CardDescription>
                    Hemos enviado las instrucciones a <strong>{email}</strong>
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center text-sm text-muted-foreground">
                  <p>
                    Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                    El enlace expirará en 24 horas.
                  </p>
                  <p className="mt-4">
                    ¿No recibiste el correo?{" "}
                    <button 
                      onClick={() => setIsSubmitted(false)} 
                      className="text-primary hover:underline"
                    >
                      Intentar de nuevo
                    </button>
                  </p>
                </CardContent>
              </>
            )}
            <CardFooter className="pt-0">
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/orbit-tasksflow/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al inicio de sesión
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
