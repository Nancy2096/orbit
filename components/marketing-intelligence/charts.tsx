"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function ChartCard({ title, description, children, className }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}

interface LineChartData {
  name?: string
  [key: string]: string | number | undefined
}

interface LineKeyConfig {
  key?: string
  dataKey?: string
  color: string
  name?: string
}

interface MILineChartProps {
  data: LineChartData[]
  dataKeys?: LineKeyConfig[]
  lines?: LineKeyConfig[]
  xAxisKey?: string
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  valueFormatter?: (value: number) => string
}

export function MILineChart({
  data,
  dataKeys,
  lines,
  xAxisKey = "name",
  height = 300,
  showGrid = true,
  showLegend = true,
  valueFormatter = (v) => v.toLocaleString()
}: MILineChartProps) {
  // Support both dataKeys and lines props
  const lineConfigs = dataKeys || lines || []
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
        <XAxis 
          dataKey={xAxisKey} 
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis 
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={valueFormatter}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px'
          }}
          formatter={(value: number) => [valueFormatter(value), '']}
        />
        {showLegend && <Legend />}
        {lineConfigs.map((dk) => {
          const key = dk.key || dk.dataKey || ''
          return (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={dk.name || key}
              stroke={dk.color}
              strokeWidth={2}
              dot={{ fill: dk.color, strokeWidth: 2 }}
            />
          )
        })}
      </LineChart>
    </ResponsiveContainer>
  )
}

interface MIAreaChartProps {
  data: LineChartData[]
  dataKeys?: LineKeyConfig[]
  lines?: LineKeyConfig[]
  xAxisKey?: string
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  valueFormatter?: (value: number) => string
}

export function MIAreaChart({
  data,
  dataKeys,
  lines,
  xAxisKey = "name",
  height = 300,
  showGrid = true,
  showLegend = true,
  valueFormatter = (v) => v.toLocaleString()
}: MIAreaChartProps) {
  const lineConfigs = dataKeys || lines || []
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
        <XAxis 
          dataKey={xAxisKey} 
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis 
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={valueFormatter}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px'
          }}
          formatter={(value: number) => [valueFormatter(value), '']}
        />
        {showLegend && <Legend />}
        {lineConfigs.map((dk) => {
          const key = dk.key || dk.dataKey || ''
          return (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={dk.name || key}
              stroke={dk.color}
              fill={dk.color}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          )
        })}
      </AreaChart>
    </ResponsiveContainer>
  )
}

interface BarChartData {
  name: string
  [key: string]: string | number
}

interface MIBarChartProps {
  data: BarChartData[]
  dataKeys: { key: string; color: string; name?: string }[]
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  layout?: 'horizontal' | 'vertical'
  valueFormatter?: (value: number) => string
}

export function MIBarChart({
  data,
  dataKeys,
  height = 300,
  showGrid = true,
  showLegend = true,
  layout = 'horizontal',
  valueFormatter = (v) => v.toLocaleString()
}: MIBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout === 'vertical' ? 'vertical' : 'horizontal'}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
        {layout === 'vertical' ? (
          <>
            <YAxis 
              dataKey="name" 
              type="category"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              width={100}
            />
            <XAxis 
              type="number"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={valueFormatter}
            />
          </>
        ) : (
          <>
            <XAxis 
              dataKey="name" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={valueFormatter}
            />
          </>
        )}
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px'
          }}
          formatter={(value: number) => [valueFormatter(value), '']}
        />
        {showLegend && <Legend />}
        {dataKeys.map((dk) => (
          <Bar
            key={dk.key}
            dataKey={dk.key}
            name={dk.name || dk.key}
            fill={dk.color}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

interface PieChartData {
  name: string
  value: number
  color?: string
}

interface MIPieChartProps {
  data: PieChartData[]
  height?: number
  showLegend?: boolean
  innerRadius?: number
  valueFormatter?: (value: number) => string
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16']

export function MIPieChart({
  data,
  height = 300,
  showLegend = true,
  innerRadius = 0,
  valueFormatter = (v) => v.toLocaleString()
}: MIPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px'
          }}
          formatter={(value: number) => [valueFormatter(value), '']}
        />
        {showLegend && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  )
}

// Donut Chart (Pie with inner radius)
export function MIDonutChart(props: MIPieChartProps) {
  return <MIPieChart {...props} innerRadius={50} />
}
