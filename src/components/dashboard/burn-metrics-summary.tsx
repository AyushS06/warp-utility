"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCalculator } from "@/contexts/calculator-context"

type MetricFormat = "currency" | "number" | "months"
type MetricType = "Input" | "Calculated"

type MetricDefinition = {
  key: string
  label: string
  description: string
  value: number | null
  format: MetricFormat
  type: MetricType
  decimalPlaces?: number
  formula?: string
}

type MetricCategory = {
  title: string
  description: string
  metrics: MetricDefinition[]
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

export function BurnMetricsSummary() {
  const { state } = useCalculator()
  const metrics = state.metrics

  if (!metrics) return null

  const categories: MetricCategory[] = []

  if (categories.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <Card key={category.title}>
          <CardHeader>
            <CardTitle>{category.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {category.description}
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {category.metrics.map((metric) => (
                <MetricRow key={metric.key} metric={metric} />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function MetricRow({ metric }: { metric: MetricDefinition }) {
  const displayValue = formatMetricValue(metric.value, metric.format, metric.decimalPlaces)

  const content = (
    <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">{metric.label}</p>
        <p className="text-xs text-muted-foreground">{metric.description}</p>
      </div>
      <div className="flex flex-col items-start gap-1 text-sm sm:items-end">
        <Badge variant="outline" className="uppercase tracking-wide text-[10px]">
          {metric.type}
        </Badge>
        <span className="text-lg font-semibold text-foreground">
          {displayValue}
        </span>
      </div>
    </div>
  )

  if (!metric.formula) {
    return content
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-help">{content}</div>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-sm !bg-popover !text-popover-foreground border border-border shadow-lg px-4 py-3"
        sideOffset={8}
      >
        <div className="space-y-2.5">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Calculation Formula
          </div>
          <div className="text-sm font-mono text-popover-foreground leading-relaxed break-words">
            {metric.formula}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

function formatMetricValue(
  value: number | null,
  format: MetricFormat,
  decimalPlaces = 0
) {
  if (value === null || value === undefined) {
    return "—"
  }

  if (!Number.isFinite(value)) {
    return "∞"
  }

  switch (format) {
    case "currency": {
      return currencyFormatter.format(value)
    }
    case "months":
    case "number": {
      return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: decimalPlaces,
        minimumFractionDigits: decimalPlaces,
      }).format(value)
    }
    default:
      return `${value}`
  }
}

