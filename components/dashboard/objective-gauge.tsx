"use client"

import type React from "react"
import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts"
import { ChartContainer } from "@/components/ui/chart"

interface ObjectiveGaugeProps {
  label: string
  current: number
  target: number
  color?: string
  icon?: React.ComponentType<{ className?: string }>
  unitLabel?: string
}

export function ObjectiveGauge({
  label,
  current,
  target,
  color = "var(--chart-1)",
  icon: Icon,
  unitLabel,
}: ObjectiveGaugeProps) {
  const hasTarget = target > 0
  const pct = hasTarget ? Math.min(100, Math.round((current / target) * 100)) : 0
  const data = [{ name: label, value: pct, fill: color }]

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
        {label}
      </div>

      <div className="relative mt-1">
        <ChartContainer config={{ value: { label } }} className="h-[190px] w-[240px]">
          <RadialBarChart
            data={data}
            startAngle={220}
            endAngle={-40}
            innerRadius={80}
            outerRadius={130}
            barSize={22}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: "var(--muted)" }}
              dataKey="value"
              cornerRadius={12}
              angleAxisId={0}
            />
          </RadialBarChart>
        </ChartContainer>

        {/* Overlay central: valor actual y meta */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-6">
          <span className="text-4xl font-bold tabular-nums leading-none text-foreground">
            {current.toLocaleString("es-MX")}
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            {hasTarget ? `Meta: ${target.toLocaleString("es-MX")}` : "Sin meta definida"}
          </span>
          {hasTarget ? (
            <span
              className="mt-1.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
              style={{ backgroundColor: `color-mix(in oklab, ${color} 18%, transparent)`, color }}
            >
              {pct}%
            </span>
          ) : null}
        </div>
      </div>

      {unitLabel ? <p className="-mt-4 text-xs text-muted-foreground">{unitLabel}</p> : null}
    </div>
  )
}
