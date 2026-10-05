"use client"

import { AlertTriangle, CalendarClock, Clock, TrendingDown, TrendingUp, Target } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { AGING_BUCKETS, COLLECTION_TARGET_PERCENT, DUE_SOON_DAYS } from "@/lib/collections/rules"
import { BUCKET_STYLES, formatMoney, type CurrencyKpis } from "@/components/collections/shared"

export function KpiCards({ kpis, currency }: { kpis: CurrencyKpis; currency: string }) {
  const dsoDelta = kpis.dso !== null && kpis.dsoPrevious !== null ? kpis.dso - kpis.dsoPrevious : null
  const rate = kpis.collectionRate
  const meetsTarget = rate !== null && rate >= COLLECTION_TARGET_PERCENT

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="gap-3">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <CardDescription>DSO (Días de cobro)</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {kpis.dso === null ? "—" : `${kpis.dso} Días`}
            </CardTitle>
          </div>
          <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          {dsoDelta === null ? (
            <p className="text-xs text-muted-foreground">Sin datos suficientes para comparar</p>
          ) : (
            <p
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                dsoDelta <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
              )}
            >
              {dsoDelta <= 0 ? <TrendingDown className="size-3.5" /> : <TrendingUp className="size-3.5" />}
              {dsoDelta > 0 ? "+" : ""}
              {dsoDelta} días vs mes anterior
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="gap-3">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <CardDescription>Cartera Vencida Total</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {formatMoney(kpis.overdueTotal, currency, true)}
            </CardTitle>
          </div>
          <AlertTriangle className="size-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          {kpis.overduePctOfIssued === null ? (
            <p className="text-xs text-muted-foreground">Sin facturas emitidas este año</p>
          ) : (
            <Badge
              variant="outline"
              className={cn(kpis.overduePctOfIssued >= 15 ? BUCKET_STYLES.d31_60.badge : BUCKET_STYLES.current.badge)}
            >
              {kpis.overduePctOfIssued}% del total emitido en el año
            </Badge>
          )}
        </CardContent>
      </Card>

      <Card className="gap-3">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <CardDescription>Cobranza Efectiva (Mes Actual)</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">{rate === null ? "—" : `${rate}%`}</CardTitle>
          </div>
          <Target className="size-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {rate === null ? (
            <p className="text-xs text-muted-foreground">Sin facturas con vencimiento este mes</p>
          ) : (
            <>
              <Progress
                value={Math.min(rate, 100)}
                aria-label="Cobranza efectiva del mes"
                className={cn(meetsTarget ? "[&>div]:bg-emerald-500" : "[&>div]:bg-amber-500")}
              />
              <p className="text-xs text-muted-foreground">
                Meta {COLLECTION_TARGET_PERCENT}% · {formatMoney(kpis.collectedThisMonth, currency, true)} de{" "}
                {formatMoney(kpis.dueThisMonthTotal, currency, true)}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="gap-3">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <CardDescription>Por Vencer (Próximos {DUE_SOON_DAYS} días)</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {formatMoney(kpis.dueSoonTotal, currency, true)}
            </CardTitle>
          </div>
          <CalendarClock className="size-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {kpis.dueSoonCount === 0
              ? "Ninguna factura por vencer"
              : `En ${kpis.dueSoonCount} factura${kpis.dueSoonCount === 1 ? "" : "s"} pendiente${kpis.dueSoonCount === 1 ? "" : "s"}`}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export function AgingStrip({ kpis, currency }: { kpis: CurrencyKpis; currency: string }) {
  const total = AGING_BUCKETS.reduce((sum, b) => sum + kpis.aging[b.key], 0)

  return (
    <Card className="gap-4">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">Antigüedad de saldos</CardTitle>
          <CardDescription>Distribución de la cartera por cobrar en {currency}</CardDescription>
        </div>
        <span className="text-sm font-medium tabular-nums">{formatMoney(total, currency, true)}</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div
          className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label={AGING_BUCKETS.map((b) => `${b.label}: ${formatMoney(kpis.aging[b.key], currency, true)}`).join(", ")}
        >
          {total > 0 &&
            AGING_BUCKETS.map((b) => {
              const pct = (kpis.aging[b.key] / total) * 100
              if (pct <= 0) return null
              return (
                <div
                  key={b.key}
                  className={cn("h-full transition-all", BUCKET_STYLES[b.key].bar)}
                  style={{ width: `${pct}%` }}
                />
              )
            })}
        </div>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {AGING_BUCKETS.map((b) => {
            const amount = kpis.aging[b.key]
            const pct = total > 0 ? Math.round((amount / total) * 100) : 0
            return (
              <li key={b.key} className="flex flex-col gap-1 rounded-lg border p-3">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={cn("size-2 rounded-full", BUCKET_STYLES[b.key].dot)} aria-hidden="true" />
                  {b.key === "current" ? "Al día (0-30 días)" : b.label}
                </span>
                <span className="text-sm font-semibold tabular-nums">{formatMoney(amount, currency, true)}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
