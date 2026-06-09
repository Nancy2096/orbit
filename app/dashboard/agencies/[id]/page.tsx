import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Building2, Settings, Users, Briefcase, Coins, Landmark, BookOpen } from "lucide-react"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AgencyDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: agency } = await supabase
    .from("agencies")
    .select("*")
    .eq("id", id)
    .single()

  if (!agency) {
    notFound()
  }

  const { data: currencies } = await supabase
    .from("agency_currencies")
    .select(`
      *,
      currency:currencies(*)
    `)
    .eq("agency_id", id)

  const { data: bankAccounts } = await supabase
    .from("bank_accounts")
    .select(`
      *,
      currency:currencies(code, symbol)
    `)
    .eq("agency_id", id)

  const { data: departments } = await supabase
    .from("departments")
    .select("*")
    .eq("agency_id", id)
    .order("sort_order")

  const { data: positions } = await supabase
    .from("positions")
    .select(`
      *,
      department:departments(name)
    `)
    .eq("agency_id", id)
    .order("sort_order")

  const levelLabels: Record<string, string> = {
    junior: "Junior",
    mid: "Mid-Level",
    senior: "Senior",
    lead: "Lead",
    manager: "Manager",
    director: "Director",
    executive: "Ejecutivo",
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/agencies">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{agency.name}</h1>
              {agency.legal_name && (
                <p className="text-muted-foreground">{agency.legal_name}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={agency.is_active ? "default" : "secondary"} className="text-sm">
            {agency.is_active ? "Activa" : "Inactiva"}
          </Badge>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild className="flex-1 sm:flex-none min-w-[140px] h-12 justify-start">
          <Link href={`/dashboard/agencies/${id}/catalogs`}>
            <BookOpen className="mr-2 h-4 w-4 text-primary" />
            <span>Catálogos</span>
          </Link>
        </Button>
        <Button asChild className="flex-1 sm:flex-none min-w-[140px] h-12 justify-start">
          <Link href={`/dashboard/agencies/${id}/edit`}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurar</span>
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Información General */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {agency.tax_id && (
                <div>
                  <p className="text-muted-foreground">RFC / ID Fiscal</p>
                  <p className="font-medium">{agency.tax_id}</p>
                </div>
              )}
              {agency.email && (
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{agency.email}</p>
                </div>
              )}
              {agency.phone && (
                <div>
                  <p className="text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{agency.phone}</p>
                </div>
              )}
              {agency.website && (
                <div>
                  <p className="text-muted-foreground">Sitio Web</p>
                  <a href={agency.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    {agency.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </div>
            {agency.address && (
              <div className="text-sm">
                <p className="text-muted-foreground">Dirección</p>
                <p className="font-medium whitespace-pre-line">{agency.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monedas */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Monedas Habilitadas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {!currencies || currencies.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay monedas configuradas</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {currencies.map((ac: any) => (
                  <Badge 
                    key={ac.id} 
                    variant={ac.is_default ? "default" : "outline"}
                    className="text-sm"
                  >
                    {ac.currency?.code} - {ac.currency?.name}
                    {ac.is_default && " (Principal)"}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cuentas Bancarias */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Cuentas Bancarias</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!bankAccounts || bankAccounts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay cuentas bancarias configuradas</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Banco</TableHead>
                  <TableHead>Titular</TableHead>
                  <TableHead>Moneda</TableHead>
                  <TableHead>Número de Cuenta</TableHead>
                  <TableHead>CLABE</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bankAccounts.map((ba: any) => (
                  <TableRow key={ba.id}>
                    <TableCell className="font-medium">{ba.bank_name}</TableCell>
                    <TableCell>{ba.account_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ba.currency?.code}</Badge>
                    </TableCell>
                    <TableCell>{ba.account_number || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{ba.clabe || "-"}</TableCell>
                    <TableCell>
                      {ba.account_type === "checking" && "Cheques"}
                      {ba.account_type === "savings" && "Ahorro"}
                      {ba.account_type === "investment" && "Inversión"}
                      {ba.account_type === "other" && "Otra"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Departamentos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Departamentos</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!departments || departments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay departamentos configurados</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {departments.map((dept: any) => (
                <Badge 
                  key={dept.id} 
                  variant={dept.is_active ? "default" : "secondary"}
                >
                  {dept.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Puestos y Cargas de Trabajo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Puestos y Cargas de Trabajo</CardTitle>
          </div>
          <CardDescription>
            Define los puestos disponibles y la capacidad de carga de trabajo (cuentas y subordinados) para cada uno
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!positions || positions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay puestos configurados</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Puesto</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead className="text-center">Cuentas (min-max)</TableHead>
                  <TableHead className="text-center">Subordinados (min-max)</TableHead>
                  <TableHead>Costo/Hora</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((pos: any) => (
                  <TableRow key={pos.id}>
                    <TableCell className="font-medium">{pos.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {pos.department?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{levelLabels[pos.level] || pos.level}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-medium">
                        {pos.min_accounts ?? 0} - {pos.max_accounts ?? 10}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-medium">
                        {pos.min_subordinates ?? 0} - {pos.max_subordinates ?? 5}
                      </span>
                    </TableCell>
                    <TableCell>
                      {pos.default_hourly_cost ? `$${pos.default_hourly_cost.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={pos.is_active ? "default" : "secondary"}>
                        {pos.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
