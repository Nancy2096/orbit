"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel, FieldSet, FieldLegend } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Building2, Plus, Trash2, Landmark, Coins } from "lucide-react"
import Link from "next/link"

interface Currency {
  id: string
  code: string
  name: string
  symbol: string
}

interface BankAccount {
  id: string
  currency_id: string
  bank_name: string
  account_name: string
  account_number: string
  clabe: string
  swift_code: string
  iban: string
  account_type: string
  is_primary: boolean
}

export default function NewAgencyPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([])
  const [defaultCurrency, setDefaultCurrency] = useState<string>("")
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const [formData, setFormData] = useState({
    name: "",
    legal_name: "",
    tax_id: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    is_active: true,
  })

  useEffect(() => {
    async function loadCurrencies() {
      const { data } = await supabase
        .from("currencies")
        .select("*")
        .eq("is_active", true)
        .order("code")
      
      if (data) {
        setCurrencies(data)
        // Set MXN as default if available
        const mxn = data.find(c => c.code === "MXN")
        if (mxn) {
          setSelectedCurrencies([mxn.id])
          setDefaultCurrency(mxn.id)
        }
      }
    }
    loadCurrencies()
  }, [supabase])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const toggleCurrency = (currencyId: string) => {
    setSelectedCurrencies(prev => {
      if (prev.includes(currencyId)) {
        // Remove currency
        const newSelected = prev.filter(id => id !== currencyId)
        // If removing default, set new default
        if (defaultCurrency === currencyId && newSelected.length > 0) {
          setDefaultCurrency(newSelected[0])
        }
        // Remove bank accounts with this currency
        setBankAccounts(accounts => accounts.filter(a => a.currency_id !== currencyId))
        return newSelected
      } else {
        // Add currency
        if (prev.length === 0) {
          setDefaultCurrency(currencyId)
        }
        return [...prev, currencyId]
      }
    })
  }

  const addBankAccount = () => {
    const newAccount: BankAccount = {
      id: crypto.randomUUID(),
      currency_id: defaultCurrency || selectedCurrencies[0] || "",
      bank_name: "",
      account_name: "",
      account_number: "",
      clabe: "",
      swift_code: "",
      iban: "",
      account_type: "checking",
      is_primary: bankAccounts.length === 0,
    }
    setBankAccounts([...bankAccounts, newAccount])
  }

  const updateBankAccount = (id: string, field: keyof BankAccount, value: string | boolean) => {
    setBankAccounts(accounts =>
      accounts.map(account => {
        if (account.id === id) {
          if (field === "is_primary" && value === true) {
            // Unset other primaries for the same currency
            return { ...account, [field]: value }
          }
          return { ...account, [field]: value }
        }
        if (field === "is_primary" && value === true) {
          // Unset this account's primary if another is being set as primary
          const updatingAccount = accounts.find(a => a.id === id)
          if (updatingAccount && account.currency_id === updatingAccount.currency_id) {
            return { ...account, is_primary: false }
          }
        }
        return account
      })
    )
  }

  const removeBankAccount = (id: string) => {
    setBankAccounts(accounts => accounts.filter(a => a.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (selectedCurrencies.length === 0) {
      setError("Debes seleccionar al menos una moneda")
      setLoading(false)
      return
    }

    // Get default currency code for the agency table
    const defaultCurrencyData = currencies.find(c => c.id === defaultCurrency)

    // Create agency
    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .insert([{ 
        ...formData, 
        currency: defaultCurrencyData?.code || "MXN" 
      }])
      .select()
      .single()

    if (agencyError) {
      setError(agencyError.message)
      setLoading(false)
      return
    }

    // Add agency currencies
    const currencyInserts = selectedCurrencies.map(currencyId => ({
      agency_id: agency.id,
      currency_id: currencyId,
      is_default: currencyId === defaultCurrency,
    }))

    const { error: currencyError } = await supabase
      .from("agency_currencies")
      .insert(currencyInserts)

    if (currencyError) {
      setError(currencyError.message)
      setLoading(false)
      return
    }

    // Add bank accounts
    if (bankAccounts.length > 0) {
      const bankInserts = bankAccounts.map(account => ({
        agency_id: agency.id,
        currency_id: account.currency_id,
        bank_name: account.bank_name,
        account_name: account.account_name,
        account_number: account.account_number || null,
        clabe: account.clabe || null,
        swift_code: account.swift_code || null,
        iban: account.iban || null,
        account_type: account.account_type,
        is_primary: account.is_primary,
      }))

      const { error: bankError } = await supabase
        .from("bank_accounts")
        .insert(bankInserts)

      if (bankError) {
        setError(bankError.message)
        setLoading(false)
        return
      }
    }

    router.push("/dashboard/agencies")
    router.refresh()
  }

  const getCurrencyById = (id: string) => currencies.find(c => c.id === id)

  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-40 bg-muted rounded animate-pulse" />
            <div className="h-4 w-60 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="h-96 bg-muted rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/agencies">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nueva Agencia</h1>
          <p className="text-muted-foreground">
            Registra una nueva agencia en el sistema
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Información General */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Información General</CardTitle>
                  <CardDescription>
                    Datos básicos de la agencia
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Nombre de la Agencia *</FieldLabel>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ej: Agencia Digital MX"
                    required
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="legal_name">Razón Social</FieldLabel>
                    <Input
                      id="legal_name"
                      name="legal_name"
                      value={formData.legal_name}
                      onChange={handleChange}
                      placeholder="Ej: Agencia Digital MX S.A. de C.V."
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="tax_id">RFC / ID Fiscal</FieldLabel>
                    <Input
                      id="tax_id"
                      name="tax_id"
                      value={formData.tax_id}
                      onChange={handleChange}
                      placeholder="Ej: XAXX010101000"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="contacto@agencia.com"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+52 55 1234 5678"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="website">Sitio Web</FieldLabel>
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://www.agencia.com"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="address">Dirección</FieldLabel>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Dirección completa de la agencia"
                    rows={2}
                  />
                </Field>

                <Field>
                  <div className="flex items-center justify-between">
                    <div>
                      <FieldLabel htmlFor="is_active">Estado Activo</FieldLabel>
                      <p className="text-sm text-muted-foreground">
                        La agencia podrá operar en el sistema
                      </p>
                    </div>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                  </div>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Monedas */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 text-accent">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Monedas Habilitadas</CardTitle>
                  <CardDescription>
                    Selecciona las monedas con las que operará la agencia para facturación y cobros
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {currencies.map((currency) => (
                    <label
                      key={currency.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedCurrencies.includes(currency.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Checkbox
                        checked={selectedCurrencies.includes(currency.id)}
                        onCheckedChange={() => toggleCurrency(currency.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {currency.symbol} {currency.code}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {currency.name}
                        </div>
                      </div>
                      {selectedCurrencies.includes(currency.id) && (
                        <div
                          className={`px-2 py-1 rounded text-xs font-medium cursor-pointer ${
                            defaultCurrency === currency.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-primary/20"
                          }`}
                          onClick={(e) => {
                            e.preventDefault()
                            setDefaultCurrency(currency.id)
                          }}
                        >
                          {defaultCurrency === currency.id ? "Principal" : "Hacer principal"}
                        </div>
                      )}
                    </label>
                  ))}
                </div>
                {selectedCurrencies.length === 0 && (
                  <p className="text-sm text-destructive">
                    Debes seleccionar al menos una moneda
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cuentas Bancarias */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 text-accent">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Cuentas Bancarias</CardTitle>
                    <CardDescription>
                      Configura las cuentas bancarias para recibir pagos en diferentes monedas
                    </CardDescription>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBankAccount}
                  disabled={selectedCurrencies.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Cuenta
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {bankAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Landmark className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay cuentas bancarias configuradas</p>
                  <p className="text-sm">
                    Agrega cuentas para recibir pagos en las monedas habilitadas
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bankAccounts.map((account, index) => (
                    <div
                      key={account.id}
                      className="p-4 rounded-lg border border-border bg-card"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Cuenta {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBankAccount(account.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field>
                            <FieldLabel>Moneda *</FieldLabel>
                            <Select
                              value={account.currency_id}
                              onValueChange={(value) =>
                                updateBankAccount(account.id, "currency_id", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar moneda" />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedCurrencies.map((currencyId) => {
                                  const currency = getCurrencyById(currencyId)
                                  return currency ? (
                                    <SelectItem key={currency.id} value={currency.id}>
                                      {currency.symbol} {currency.code} - {currency.name}
                                    </SelectItem>
                                  ) : null
                                })}
                              </SelectContent>
                            </Select>
                          </Field>

                          <Field>
                            <FieldLabel>Tipo de Cuenta</FieldLabel>
                            <Select
                              value={account.account_type}
                              onValueChange={(value) =>
                                updateBankAccount(account.id, "account_type", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="checking">Cuenta Corriente</SelectItem>
                                <SelectItem value="savings">Cuenta de Ahorro</SelectItem>
                                <SelectItem value="investment">Inversión</SelectItem>
                                <SelectItem value="other">Otro</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field>
                            <FieldLabel>Nombre del Banco *</FieldLabel>
                            <Input
                              value={account.bank_name}
                              onChange={(e) =>
                                updateBankAccount(account.id, "bank_name", e.target.value)
                              }
                              placeholder="Ej: BBVA, Santander, Chase"
                              required
                            />
                          </Field>

                          <Field>
                            <FieldLabel>Titular de la Cuenta *</FieldLabel>
                            <Input
                              value={account.account_name}
                              onChange={(e) =>
                                updateBankAccount(account.id, "account_name", e.target.value)
                              }
                              placeholder="Nombre del titular"
                              required
                            />
                          </Field>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field>
                            <FieldLabel>Número de Cuenta</FieldLabel>
                            <Input
                              value={account.account_number}
                              onChange={(e) =>
                                updateBankAccount(account.id, "account_number", e.target.value)
                              }
                              placeholder="Número de cuenta"
                            />
                          </Field>

                          <Field>
                            <FieldLabel>CLABE (México)</FieldLabel>
                            <Input
                              value={account.clabe}
                              onChange={(e) =>
                                updateBankAccount(account.id, "clabe", e.target.value)
                              }
                              placeholder="18 dígitos"
                              maxLength={18}
                            />
                          </Field>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field>
                            <FieldLabel>SWIFT/BIC (Internacional)</FieldLabel>
                            <Input
                              value={account.swift_code}
                              onChange={(e) =>
                                updateBankAccount(account.id, "swift_code", e.target.value)
                              }
                              placeholder="Código SWIFT"
                            />
                          </Field>

                          <Field>
                            <FieldLabel>IBAN (Internacional)</FieldLabel>
                            <Input
                              value={account.iban}
                              onChange={(e) =>
                                updateBankAccount(account.id, "iban", e.target.value)
                              }
                              placeholder="Número IBAN"
                            />
                          </Field>
                        </div>

                        <Field>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`primary-${account.id}`}
                              checked={account.is_primary}
                              onCheckedChange={(checked) =>
                                updateBankAccount(account.id, "is_primary", checked === true)
                              }
                            />
                            <label
                              htmlFor={`primary-${account.id}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              Cuenta principal para {getCurrencyById(account.currency_id)?.code || "esta moneda"}
                            </label>
                          </div>
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error y Botones */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" asChild className="flex-1">
              <Link href="/dashboard/agencies">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Spinner className="mr-2" />
                  Creando...
                </>
              ) : (
                "Crear Agencia"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
