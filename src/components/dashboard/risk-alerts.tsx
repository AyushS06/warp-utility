"use client"

import * as React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { useCalculator } from "@/contexts/calculator-context"

export function RiskAlerts() {
  const { state } = useCalculator()
  const runway = state.metrics?.remainingRunwayMonths

  if (!runway || runway === Infinity) {
    return null
  }

  let tone: "critical" | "warning" | null = null
  if (runway < 12) {
    tone = "critical"
  } else if (runway < 18) {
    tone = "warning"
  }

  if (!tone) {
    return null
  }

  const monthsLabel = runway.toFixed(1)

  return (
    <Card
      className={
        tone === "critical"
          ? "border-destructive/40 bg-destructive/10"
          : "border-amber-500/40 bg-amber-500/10"
      }
    >
      <CardContent className="py-4">
        <p
          className={
            tone === "critical"
              ? "text-destructive font-semibold"
              : "text-amber-700 dark:text-amber-200 font-semibold"
          }
        >
          {tone === "critical"
            ? `Runway under 12 months (${monthsLabel} months remaining). Consider reducing burn or raising capital.`
            : `Runway under 18 months (${monthsLabel} months remaining). Start planning mitigation.`}
        </p>
      </CardContent>
    </Card>
  )
}

