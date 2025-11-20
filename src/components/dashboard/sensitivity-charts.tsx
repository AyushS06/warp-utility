"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useCalculator } from "@/contexts/calculator-context"

// Helper to get computed CSS variable value as RGB color
function useThemeColor(variable: string, fallback: string): string {
  const [value, setValue] = React.useState(fallback)

  React.useEffect(() => {
    const updateValue = () => {
      if (typeof window !== "undefined") {
        const root = document.documentElement
        const computed = getComputedStyle(root).getPropertyValue(variable).trim()
        // If it's already an RGB value, use it directly
        if (computed && (computed.startsWith("rgb") || computed.startsWith("#"))) {
          setValue(computed)
        } else if (computed) {
          // If it's a different format, try to use it
          setValue(computed)
        } else {
          setValue(fallback)
        }
      }
    }

    updateValue()
    // Listen for theme changes
    const observer = new MutationObserver(updateValue)
    if (typeof window !== "undefined") {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      })
      // Also listen for any style changes
      window.addEventListener("resize", updateValue)
    }

    return () => {
      observer.disconnect()
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", updateValue)
      }
    }
  }, [variable, fallback])

  return value
}

const burnConfig: ChartConfig = {
  monthlyBurn: {
    label: "Monthly burn",
    theme: {
      light: "hsl(220 70% 50%)",
      dark: "hsl(220 70% 60%)",
    },
  },
}

const runwayConfig: ChartConfig = {
  runwayMonths: {
    label: "Runway months",
    theme: {
      light: "hsl(140 60% 45%)",
      dark: "hsl(140 60% 55%)",
    },
  },
}

export function SensitivityCharts() {
  const { state } = useCalculator()
  const metrics = state.metrics
  const foregroundColor = useThemeColor("--foreground", "rgb(10, 10, 10)")
  const borderColor = useThemeColor("--border", "rgb(229, 229, 229)")

  if (!metrics) {
    return null
  }

  const sensitivityData = metrics.sensitivityBands.map((band) => ({
    scenario: band.label,
    monthlyBurn: Math.round(band.monthlyBurn),
    runwayMonths: Number(band.runwayMonths.toFixed(1)),
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Burn sensitivity</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={burnConfig} className="h-72">
            <BarChart data={sensitivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
              <XAxis
                dataKey="scenario"
                stroke={foregroundColor}
                tick={{ fill: foregroundColor, fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) =>
                  new Intl.NumberFormat("en-US", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(value as number)
                }
                stroke={foregroundColor}
                tick={{ fill: foregroundColor, fontSize: 12 }}
              />
              <ChartTooltip
                cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                content={<ChartTooltipContent />}
              />
              <Bar dataKey="monthlyBurn" fill="var(--color-monthlyBurn)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Runway outlook</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={runwayConfig} className="h-72">
            <BarChart data={sensitivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
              <XAxis
                dataKey="scenario"
                stroke={foregroundColor}
                tick={{ fill: foregroundColor, fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) => `${value} mo`}
                stroke={foregroundColor}
                tick={{ fill: foregroundColor, fontSize: 12 }}
              />
              <ChartTooltip
                cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                content={<ChartTooltipContent />}
              />
              <Bar
                dataKey="runwayMonths"
                fill="var(--color-runwayMonths)"
                radius={4}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

