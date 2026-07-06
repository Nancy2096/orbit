"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Building2, FolderKanban, FileCheck2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import {
  IVA_RATE,
  computeTotals,
  formatCurrency,
  lineAmount,
  periodLabel,
  periodStartFromMonth,
  recentMonths,
} from "@/lib/pre-invoices"

interface DraftLine {
  key: string
  source_service_type: "account_service" | "project_service"
  source_service_id: string
  service_id: string | null
  description: string
  quantity: number
  unit_price: number
  discount: number
  amount: number
  is_included: boolean
}

interface DraftGroup {
  source_type: "account" | "project"
  source_id: string
  title: string
  subtitle: string
  client_id: string | null
  agency_id: string | null
  agency_name: string
  currency: string
  alreadyExists: boolean
  lines: DraftLine[]
}

export default function GeneratePreInvoicesPage() {
  const router = useRouter()
  const supabase = createClient()
  const months = useMemo(() => recentMonths(12), [])
  const [month, setMonth] = useState(months[0]?.value ?? "")
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([])
  const [agencyFilter, setAgencyFilter] = useState<string>("all")
  const [groups, setGroups] = useState<DraftGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    supabase
      .from("agencies")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        if (data) setAgencies(data)
      })
  }, [supabase])

  async function loadSources() {
    if (!month) return
    setLoading(true)
    setLoaded(false)
    const periodStart = periodStartFromMonth(month)

    // Prefacturas ya existentes en el periodo para no duplicar.
    const { data: existing } = await supabase
      .from("pre_invoices")
      .select("source_type, account_id, project_id")
      .eq("period_start", periodStart)
      .neq("status", "cancelled")

    const existingAccounts = new Set(
      (existing || []).filter((e) => e.source_type === "account").map((e) => e.account_id),
    )
    const existingProjects = new Set(
      (existing || []).filter((e) => e.source_type === "project").map((e) => e.project_id),
    )

    // Cuentas activas con sus servicios contratados.
    let accountsQuery = supabase
      .from("accounts")
      .select(
        `id, account_name, account_code, client_id, agency_id,
         agency:agencies(id, name),
         client:clients(id, company_name),
         account_services(id, service_id, custom_name, quantity, unit_price, final_price, frequency, is_active, service:services(name))`,
      )
      .eq("status", "active")

    if (agencyFilter !== "all") accountsQuery = accountsQuery.eq("agency_id", agencyFilter)

    // Proyectos activos con sus servicios.
    let projectsQuery = supabase
      .from("projects")
      .select(
        `id, name, project_code, account_id, status, is_billable,
         account:accounts(id, account_name, client_id, agency_id, agency:agencies(id, name), client:clients(id, company_name)),
         project_services(id, service_id, quantity, unit_price, discount_percentage, total_price, currency, notes, service:services(name))`,
      )
      .eq("status", "active")

    const [accountsRes, projectsRes] = await Promise.all([accountsQuery, projectsQuery])

    const draftGroups: DraftGroup[] = []

    for (const acc of accountsRes.data || []) {
      const agency = (acc.agency as { id: string; name: string } | null) ?? null
      if (agencyFilter !== "all" && acc.agency_id !== agencyFilter) continue
      const services = (acc.account_services || []).filter((s: { is_active: boolean }) => s.is_active)
      if (services.length === 0) continue
      const lines: DraftLine[] = services.map((s: {
        id: string
        service_id: string | null
        custom_name: string | null
        quantity: number
        unit_price: number
        service: { name: string } | null
      }) => {
        const quantity = Number(s.quantity) || 1
        const unit_price = Number(s.unit_price) || 0
        return {
          key: `as-${s.id}`,
          source_service_type: "account_service" as const,
          source_service_id: s.id,
          service_id: s.service_id,
          description: s.custom_name || s.service?.name || "Servicio",
          quantity,
          unit_price,
          discount: 0,
          amount: lineAmount(quantity, unit_price, 0),
          is_included: true,
        }
      })
      draftGroups.push({
        source_type: "account",
        source_id: acc.id,
        title: acc.account_name,
        subtitle: acc.account_code || "Cuenta",
        client_id: acc.client_id,
        agency_id: acc.agency_id,
        agency_name: agency?.name || "Sin agencia",
        currency: "MXN",
        alreadyExists: existingAccounts.has(acc.id),
        lines,
      })
    }

    for (const proj of projectsRes.data || []) {
      const account = (proj.account as {
        id: string
        client_id: string | null
        agency_id: string | null
        agency: { id: string; name: string } | null
      } | null) ?? null
      if (agencyFilter !== "all" && account?.agency_id !== agencyFilter) continue
      const services = proj.project_services || []
      if (services.length === 0) continue
      const lines: DraftLine[] = services.map((s: {
        id: string
        service_id: string | null
        quantity: number
        unit_price: number
        discount_percentage: number
        service: { name: string } | null
        notes: string | null
      }) => {
        const quantity = Number(s.quantity) || 1
        const unit_price = Number(s.unit_price) || 0
        const discount = Number(s.discount_percentage) || 0
        return {
          key: `ps-${s.id}`,
          source_service_type: "project_service" as const,
          source_service_id: s.id,
          service_id: s.service_id,
          description: s.service?.name || s.notes || "Servicio",
          quantity,
          unit_price,
          discount,
          amount: lineAmount(quantity, unit_price, discount),
          is_included: true,
        }
      })
      draftGroups.push({
        source_type: "project",
        source_id: proj.id,
        title: proj.name,
        subtitle: proj.project_code || "Proyecto",
        client_id: account?.client_id ?? null,
        agency_id: account?.agency_id ?? null,
        agency_name: account?.agency?.name || "Sin agencia",
        currency: (services[0]?.currency as string) || "MXN",
        alreadyExists: existingProjects.has(proj.id),
        lines,
      })
    }

    draftGroups.sort((a, b) => a.title.localeCompare(b.title))
    setGroups(draftGroups)
    setLoading(false)
    setLoaded(true)
  }

  function toggleLine(groupIdx: number, lineKey: string) {
    setGroups((prev) =>
      prev.map((g, i) =>
        i !== groupIdx
          ? g
          : {
              ...g,
              lines: g.lines.map((l) => (l.key === lineKey ? { ...l, is_included: !l.is_included } : l)),
            },
      ),
    )
  }

  function toggleGroup(groupIdx: number, value: boolean) {
    setGroups((prev) =>
      prev.map((g, i) =>
        i !== groupIdx ? g : { ...g, lines: g.lines.map((l) => ({ ...l, is_included: value })) },
      ),
    )
  }

  const generatableGroups = groups.filter(
    (g) => !g.alreadyExists && g.lines.some((l) => l.is_included),
  )

  async function handleGenerate() {
    if (generatableGroups.length === 0) {
      toast.error("No hay prefacturas nuevas para generar en este periodo")
      return
    }
    setSaving(true)
    const periodStart = periodStartFromMonth(month)
    const label = periodLabel(periodStart)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Numeración correlativa por año.
    const year = new Date(periodStart).getFullYear()
    const { count } = await supabase
      .from("pre_invoices")
      .select("*", { count: "exact", head: true })
      .gte("period_start", `${year}-01-01`)
      .lte("period_start", `${year}-12-31`)
    let seq = (count || 0) + 1

    let created = 0
    try {
      for (const group of generatableGroups) {
        const totals = computeTotals(group.lines)
        const number = `PRE-${year}-${String(seq).padStart(5, "0")}`
        seq++

        const { data: preInvoice, error: preErr } = await supabase
          .from("pre_invoices")
          .insert({
            pre_invoice_number: number,
            source_type: group.source_type,
            account_id: group.source_type === "account" ? group.source_id : null,
            project_id: group.source_type === "project" ? group.source_id : null,
            client_id: group.client_id,
            agency_id: group.agency_id,
            period_start: periodStart,
            period_label: label,
            status: "draft",
            currency: group.currency,
            subtotal: totals.subtotal,
            tax: totals.tax,
            total: totals.total,
            created_by: user?.id ?? null,
          })
          .select()
          .single()

        if (preErr || !preInvoice) throw new Error(preErr?.message || "Error al crear prefactura")

        const items = group.lines.map((l, index) => ({
          pre_invoice_id: preInvoice.id,
          source_service_type: l.source_service_type,
          source_service_id: l.source_service_id,
          service_id: l.service_id,
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          discount: l.discount,
          amount: l.amount,
          is_included: l.is_included,
          sort_order: index,
        }))

        const { error: itemsErr } = await supabase.from("pre_invoice_items").insert(items)
        if (itemsErr) throw new Error(itemsErr.message)
        created++
      }

      toast.success(`${created} prefactura(s) generada(s) para ${label}`)
      router.push("/dashboard/pre-invoices")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al generar prefacturas")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/pre-invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Generar Pre-Facturas</h1>
          <p className="text-muted-foreground">
            Selecciona el periodo y desglosa los servicios a prefacturar de cuentas y proyectos activos
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Periodo</CardTitle>
          <CardDescription>Elige el mes y la agencia a prefacturar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <Label>Mes a facturar</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Agencia</Label>
              <Select value={agencyFilter} onValueChange={setAgencyFilter}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Agencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las agencias</SelectItem>
                  {agencies.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={loadSources} disabled={loading || !month}>
              {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Cargar servicios
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {loaded && !loading && groups.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No hay cuentas o proyectos activos con servicios para este periodo</p>
            <p className="text-sm text-muted-foreground">
              Verifica que existan cuentas/proyectos activos con servicios en Operaciones.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && groups.length > 0 && (
        <>
          <div className="space-y-4">
            {groups.map((group, groupIdx) => {
              const totals = computeTotals(group.lines)
              const allChecked = group.lines.every((l) => l.is_included)
              return (
                <Card key={`${group.source_type}-${group.source_id}`} className={group.alreadyExists ? "opacity-70" : ""}>
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {group.source_type === "account" ? (
                          <Building2 className="mt-1 h-5 w-5 text-muted-foreground" />
                        ) : (
                          <FolderKanban className="mt-1 h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <CardTitle className="text-lg">{group.title}</CardTitle>
                          <CardDescription>
                            {group.subtitle} · {group.agency_name} ·{" "}
                            {group.source_type === "account" ? "Cuenta" : "Proyecto"}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {group.alreadyExists ? (
                          <Badge variant="outline">Ya prefacturada</Badge>
                        ) : (
                          <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Checkbox
                              checked={allChecked}
                              onCheckedChange={(v) => toggleGroup(groupIdx, Boolean(v))}
                            />
                            Incluir todo
                          </label>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Incluir</TableHead>
                          <TableHead>Servicio</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">P. Unitario</TableHead>
                          <TableHead className="text-right">Desc.</TableHead>
                          <TableHead className="text-right">Importe</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.lines.map((line) => (
                          <TableRow key={line.key} className={line.is_included ? "" : "opacity-50"}>
                            <TableCell>
                              <Checkbox
                                checked={line.is_included}
                                disabled={group.alreadyExists}
                                onCheckedChange={() => toggleLine(groupIdx, line.key)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{line.description}</TableCell>
                            <TableCell className="text-right">{line.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(line.unit_price, group.currency)}</TableCell>
                            <TableCell className="text-right">{line.discount ? `${line.discount}%` : "-"}</TableCell>
                            <TableCell className="text-right">{formatCurrency(line.amount, group.currency)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="mt-4 flex flex-col items-end gap-1 text-sm">
                      <div className="flex w-full max-w-xs justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(totals.subtotal, group.currency)}</span>
                      </div>
                      <div className="flex w-full max-w-xs justify-between">
                        <span className="text-muted-foreground">IVA ({IVA_RATE * 100}%)</span>
                        <span>{formatCurrency(totals.tax, group.currency)}</span>
                      </div>
                      <div className="flex w-full max-w-xs justify-between font-semibold">
                        <span>Total</span>
                        <span>{formatCurrency(totals.total, group.currency)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="sticky bottom-0 flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">
              {generatableGroups.length} prefactura(s) nueva(s) a generar de {groups.length} origen(es)
            </p>
            <Button onClick={handleGenerate} disabled={saving || generatableGroups.length === 0}>
              {saving ? <Spinner className="mr-2 h-4 w-4" /> : <FileCheck2 className="mr-2 h-4 w-4" />}
              Generar Pre-Facturas
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
