"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PublishingHour } from "@/lib/marketing-intelligence/brand-phase2-types"

interface BestTimeHeatmapProps {
  data: PublishingHour[]
  platform?: string
  onSelectTime?: (dayOfWeek: number, hour: number) => void
}

const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const hours = Array.from({ length: 24 }, (_, i) => i)

function getScoreColor(score: number): string {
  if (score >= 90) return 'bg-emerald-500'
  if (score >= 80) return 'bg-emerald-400'
  if (score >= 70) return 'bg-green-400'
  if (score >= 60) return 'bg-lime-400'
  if (score >= 50) return 'bg-yellow-400'
  if (score >= 40) return 'bg-amber-400'
  if (score >= 30) return 'bg-orange-400'
  if (score >= 20) return 'bg-red-400'
  return 'bg-gray-200'
}

function getScoreOpacity(score: number): number {
  return Math.max(0.3, score / 100)
}

export function BestTimeHeatmap({ data, platform, onSelectTime }: BestTimeHeatmapProps) {
  // Create a map for quick lookup
  const dataMap = React.useMemo(() => {
    const map = new Map<string, PublishingHour>()
    data.forEach(d => {
      map.set(`${d.dayOfWeek}-${d.hour}`, d)
    })
    return map
  }, [data])

  // Find top 5 best times
  const topTimes = React.useMemo(() => {
    return [...data]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }, [data])

  // Only show hours 6-23 for cleaner display
  const displayHours = hours.filter(h => h >= 6 && h <= 23)

  return (
    <div className="space-y-4">
      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour headers */}
          <div className="flex mb-1">
            <div className="w-12" /> {/* Spacer for day labels */}
            {displayHours.map(hour => (
              <div 
                key={hour} 
                className="flex-1 text-center text-xs text-muted-foreground"
              >
                {hour}:00
              </div>
            ))}
          </div>

          {/* Days */}
          <TooltipProvider>
            {dayNames.map((dayName, dayIndex) => (
              <div key={dayIndex} className="flex items-center mb-1">
                <div className="w-12 text-xs font-medium text-muted-foreground">
                  {dayName}
                </div>
                {displayHours.map(hour => {
                  const cellData = dataMap.get(`${dayIndex}-${hour}`)
                  const score = cellData?.score || 0
                  const engagementRate = cellData?.engagementRate || 0
                  
                  return (
                    <Tooltip key={hour}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onSelectTime?.(dayIndex, hour)}
                          className={`flex-1 h-8 mx-0.5 rounded transition-all hover:scale-110 hover:ring-2 hover:ring-primary ${
                            score > 0 ? getScoreColor(score) : 'bg-muted'
                          }`}
                          style={{ opacity: score > 0 ? getScoreOpacity(score) : 0.3 }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <p className="font-medium">{dayName} {hour}:00</p>
                          {score > 0 ? (
                            <>
                              <p>Score: {score}/100</p>
                              <p>Engagement: {engagementRate.toFixed(1)}%</p>
                            </>
                          ) : (
                            <p className="text-muted-foreground">Sin datos</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            ))}
          </TooltipProvider>

          {/* Legend */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-xs text-muted-foreground">Bajo</span>
            <div className="flex gap-0.5">
              {[20, 40, 60, 80, 100].map(score => (
                <div
                  key={score}
                  className={`w-6 h-3 rounded ${getScoreColor(score)}`}
                  style={{ opacity: getScoreOpacity(score) }}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">Alto</span>
          </div>
        </div>
      </div>

      {/* Top Times */}
      <div>
        <h4 className="text-sm font-medium mb-2">Mejores horarios recomendados</h4>
        <div className="flex flex-wrap gap-2">
          {topTimes.map((time, index) => (
            <Badge
              key={`${time.dayOfWeek}-${time.hour}`}
              variant={index === 0 ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/10"
              onClick={() => onSelectTime?.(time.dayOfWeek, time.hour)}
            >
              {dayNames[time.dayOfWeek]} {time.hour}:00
              <span className="ml-1 text-xs opacity-70">
                ({time.score})
              </span>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

// Compact version for sidebar or small spaces
interface BestTimeCompactProps {
  data: PublishingHour[]
  count?: number
}

export function BestTimeCompact({ data, count = 3 }: BestTimeCompactProps) {
  const topTimes = React.useMemo(() => {
    return [...data]
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
  }, [data, count])

  return (
    <div className="space-y-1">
      {topTimes.map((time, index) => (
        <div 
          key={`${time.dayOfWeek}-${time.hour}`}
          className="flex items-center justify-between text-sm"
        >
          <span className={index === 0 ? 'font-medium' : 'text-muted-foreground'}>
            {dayNames[time.dayOfWeek]} {time.hour}:00
          </span>
          <div className="flex items-center gap-2">
            <div 
              className={`w-16 h-2 rounded-full ${getScoreColor(time.score)}`}
              style={{ width: `${time.score * 0.64}px`, opacity: getScoreOpacity(time.score) }}
            />
            <span className="text-xs text-muted-foreground w-8">
              {time.score}%
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// Card wrapper for the heatmap
interface BestTimeHeatmapCardProps {
  data: PublishingHour[]
  platform?: string
  title?: string
  description?: string
  onSelectTime?: (dayOfWeek: number, hour: number) => void
}

export function BestTimeHeatmapCard({ 
  data, 
  platform,
  title = "Mejores horarios de publicación",
  description,
  onSelectTime
}: BestTimeHeatmapCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <BestTimeHeatmap 
          data={data} 
          platform={platform} 
          onSelectTime={onSelectTime}
        />
      </CardContent>
    </Card>
  )
}
