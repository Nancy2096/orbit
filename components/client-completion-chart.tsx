"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type { CategoryCompletion } from "@/lib/client-completion"

const chartConfig = {
  percentage: {
    label: "Completado",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

interface ClientCompletionChartProps {
  data: CategoryCompletion[]
  title?: string
  description?: string
  className?: string
}

export function ClientCompletionChart({
  data,
  title = "Información completada",
  description = "Porcentaje de campos completados por categoría",
  className,
}: ClientCompletionChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{ left: 8, right: 40, top: 4, bottom: 4 }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              axisLine={false}
              width={110}
              tickMargin={8}
            />
            <XAxis type="number" domain={[0, 100]} hide />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => `${value}%`}
                  hideIndicator={false}
                />
              }
            />
            <Bar dataKey="percentage" fill="var(--color-percentage)" radius={4} barSize={22}>
              <LabelList
                dataKey="percentage"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
                formatter={(value: number) => `${value}%`}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
