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
}

