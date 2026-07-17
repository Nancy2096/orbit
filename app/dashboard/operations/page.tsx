import { createClient } from "@/lib/supabase/server"
import { OperationsDashboard } from "@/components/dashboard/operations-dashboard"

export const dynamic = "force-dynamic"

interface AccountRow {
  id: string
  account_name: string | null
  account_type: string | null
  status: string | null
  retainer_amount: number | null
  retainer_currency_id: string | null
  agency_id: string | null
  created_at: string | null
}

async function getOperationsData(agencyId: string | null) {
  const supabase = await createClient()

  // Aplica el filtro por agencia solo cuando se selecciona una específica.
  let accountsQuery = supabase
    .from("accounts")
    .select("id, account_name, account_type, status, retainer_amount, retainer_currency_id, agency_id, created_at")
  let clientsQuery = supabase.from("clients").select("id, status, industry_id")
  if (agencyId) {
    accountsQuery = accountsQuery.eq("agency_id", agencyId)
    clientsQuery = clientsQuery.eq("agency_id", agencyId)
  }

  const [accountsRes, clientsRes, agenciesRes, currenciesRes, industriesRes] = await Promise.all([
    accountsQuery,
    clientsQuery,
    supabase.from("agencies").select("id, name, settings"),
    supabase.from("currencies").select("id, code"),
    supabase.from("industries").select("id, name"),
  ])

  const accounts = (accountsRes.data || []) as AccountRow[]
  const clients = (clientsRes.data || []) as { id: string; status: string | null; industry_id: string | null }[]
  const agencies = (agenciesRes.data || []) as { id: string; name: string; settings: any }[]
  const currencies = (currenciesRes.data || []) as { id: string; code: string }[]
  const industries = (industriesRes.data || []) as { id: string; name: string }[]
  const industryMap = new Map(industries.map((i) => [i.id, i.name]))

  const currencyMap = new Map(currencies.map((c) => [c.id, c.code]))
  const agencyMap = new Map(agencies.map((a) => [a.id, a.name]))

  const isActive = (s: string | null) => (s || "").toLowerCase() === "active"
  const codeOf = (id: string | null) => (id ? currencyMap.get(id) || "—" : "—")
  const amt = (a: AccountRow) => Number(a.retainer_amount) || 0

  const retainers = accounts.filter((a) => a.account_type === "retainer")
  const projects = accounts.filter((a) => a.account_type === "project")
  const activeRetainers = retainers.filter((a) => isActive(a.status))
  const activeProjects = projects.filter((a) => isActive(a.status))

  // MRR (ingreso mensual recurrente) por moneda, solo cuentas retainer activas
  const mrrByCurrency: Record<string, number> = {}
  for (const a of activeRetainers) {
    const code = codeOf(a.retainer_currency_id)
    mrrByCurrency[code] = (mrrByCurrency[code] || 0) + amt(a)
  }
  const mrrMXN = mrrByCurrency["MXN"] || 0
  const mrrUSD = mrrByCurrency["USD"] || 0

  // MRR por agencia (MXN)
  const agencyAgg = new Map<string, { mrr: number; count: number }>()
  for (const a of activeRetainers) {
    if (codeOf(a.retainer_currency_id) !== "MXN") continue
    const name = a.agency_id ? agencyMap.get(a.agency_id) || "Sin agencia" : "Sin agencia"
    const cur = agencyAgg.get(name) || { mrr: 0, count: 0 }
    cur.mrr += amt(a)
    cur.count += 1
    agencyAgg.set(name, cur)
  }
  const mrrByAgency = [...agencyAgg.entries()]
    .map(([agency, v]) => ({ agency, mrr: Math.round(v.mrr), count: v.count }))
    .sort((a, b) => b.mrr - a.mrr)

  // Distribución de cuentas por estado (todas las cuentas)
  const statusAgg = new Map<string, number>()
  for (const a of accounts) {
    const s = (a.status || "sin_estado").toLowerCase()
    statusAgg.set(s, (statusAgg.get(s) || 0) + 1)
  }
  const accountsByStatus = [...statusAgg.entries()].map(([status, count]) => ({ status, count }))

  // Top cuentas por monto mensual
  const topAccounts = (code: string) =>
    activeRetainers
      .filter((a) => codeOf(a.retainer_currency_id) === code)
      .map((a) => ({ name: a.account_name || "Sin nombre", amount: amt(a) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8)

  const topAccountsMXN = topAccounts("MXN")
  const topAccountsUSD = topAccounts("USD")

  // Clientes por tipo de cliente (industry_id -> industries.name), top 8
  const typeAgg = new Map<string, number>()
  for (const c of clients) {
    const name = c.industry_id ? industryMap.get(c.industry_id) || "Sin tipo" : "Sin tipo"
    typeAgg.set(name, (typeAgg.get(name) || 0) + 1)
  }
  const clientsByType = [...typeAgg.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // Objetivos de operación. En modo global se suman los de todas las agencias;
  // con una agencia seleccionada se usan solo los suyos.
  const objectivesSource = agencyId ? agencies.filter((a) => a.id === agencyId) : agencies
  const objectivesAgg = objectivesSource.reduce(
    (acc, a) => {
      const o = a.settings?.objectives
      if (o) {
        acc.accountsTarget += Number(o.accounts_target) || 0
        acc.projectsTarget += Number(o.projects_target) || 0
        acc.accountsMonthlyTarget += Number(o.accounts_monthly_target) || 0
        acc.projectsMonthlyTarget += Number(o.projects_monthly_target) || 0
      }
      return acc
    },
    { accountsTarget: 0, projectsTarget: 0, accountsMonthlyTarget: 0, projectsMonthlyTarget: 0 },
  )

  const objectives = {
    accountsTarget: objectivesAgg.accountsTarget,
    projectsTarget: objectivesAgg.projectsTarget,
    accountsMonthlyTarget: objectivesAgg.accountsMonthlyTarget,
    projectsMonthlyTarget: objectivesAgg.projectsMonthlyTarget,
    accountsCurrent: activeRetainers.length,
    // El tacómetro compara el total de proyectos (activos + inactivos) vs la meta.
    projectsCurrent: projects.length,
    projectsActive: activeProjects.length,
    projectsInactive: projects.length - activeProjects.length,
  }

  // Proyección de ingresos recurrentes acumulados a 12 meses (MXN y USD)
  const monthFmt = new Intl.DateTimeFormat("es-MX", { month: "short", year: "2-digit" })
  const projection: { month: string; mxn: number; usd: number }[] = []
  const now = new Date()
  for (let i = 1; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + (i - 1), 1)
    projection.push({
      month: monthFmt.format(d),
      mxn: Math.round(mrrMXN * i),
      usd: Math.round(mrrUSD * i),
    })
  }

  return {
    agencies: agencies.map((a) => ({ id: a.id, name: a.name })),
    selectedAgencyId: agencyId,
    kpis: {
      mrrMXN,
      mrrUSD,
      annualMXN: mrrMXN * 12,
      annualUSD: mrrUSD * 12,
      activeRetainers: activeRetainers.length,
      activeProjects: activeProjects.length,
      totalAccounts: accounts.length,
      clientsActive: clients.filter((c) => isActive(c.status)).length,
      clientsTotal: clients.length,
      avgTicketMXN: activeRetainers.filter((a) => codeOf(a.retainer_currency_id) === "MXN").length
        ? mrrMXN / activeRetainers.filter((a) => codeOf(a.retainer_currency_id) === "MXN").length
        : 0,
    },
    objectives,
    mrrByAgency,
    accountsByStatus,
    topAccountsMXN,
    topAccountsUSD,
    clientsByType,
    projection,
    unitByType: [
      { type: "Retainer activas", count: activeRetainers.length },
      { type: "Proyectos activos", count: activeProjects.length },
      { type: "Retainer inactivas", count: retainers.length - activeRetainers.length },
      { type: "Proyectos inactivos", count: projects.length - activeProjects.length },
    ],
  }
}

export default async function OperationsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ agency?: string }>
}) {
  const { agency } = await searchParams
  const agencyId = agency && agency !== "global" ? agency : null
  const data = await getOperationsData(agencyId)
  return <OperationsDashboard data={data} />
}

export type OperationsData = Awaited<ReturnType<typeof getOperationsData>>
