"use client"

import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export interface AccountRow {
  account: string
  amount: number
  count: number
  percentage: number
}

const CURRENCY_META: Record<string, { locale: string; label: string }> = {
  MXN: { locale: "es-MX", label: "Pesos (MXN)" },
  USD: { locale: "en-US", label: "Dólares (USD)" },
}

function formatMoney(amount: number, code: string) {
  const meta = CURRENCY_META[code] ?? { locale: "es-MX", label: code }
  return `$${amount.toLocaleString(meta.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Colores para las barras (se ciclan si hay muchas cuentas).
const BAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-teal-500",
]

function CurrencyCard({
  code,
  rows,
  unit,
}: {
  code: string
  rows: AccountRow[]
  unit: string
}) {
  const meta = CURRENCY_META[code] ?? { locale: "es-MX", label: code }
  const total = rows.reduce((sum, r) => sum + r.amount, 0)
  const totalCount = rows.reduce((sum, r) => sum + r.count, 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{meta.label}</CardTitle>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {code}
          </span>
        </div>
        <CardDescription>
          <span className="text-xl font-bold text-foreground">{formatMoney(total, code)}</span>
          <span className="ml-2 text-xs">
            {totalCount} {unit}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin información en {meta.label}</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row, index) => (
              <li key={row.account} className="space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium" title={row.account}>
                    {row.account}
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatMoney(row.amount, code)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${BAR_COLORS[index % BAR_COLORS.length]}`}
                      style={{ width: `${Math.max(row.percentage, 1)}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                    {row.percentage.toFixed(1)}% · {row.count}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function AccountBreakdown({
  title,
  description,
  icon,
  unit,
  mxn,
  usd,
}: {
  title: string
  description?: string
  icon?: ReactNode
  unit: string
  mxn: AccountRow[]
  usd: AccountRow[]
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        {icon ? <div className="mt-0.5 text-muted-foreground">{icon}</div> : null}
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <CurrencyCard code="MXN" rows={mxn} unit={unit} />
        <CurrencyCard code="USD" rows={usd} unit={unit} />
      </div>
    </section>
  )
}
