"use client"

import * as React from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CountingNumber } from "@/components/ui/shadcn-io/counting-number"
import { useCalculator } from "@/contexts/calculator-context"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value)
}

export function KpiCards() {
  const { state } = useCalculator()
  const metrics = state.metrics
  const prevValuesRef = React.useRef<Record<string, number>>({})

  if (!metrics) {
    return null
  }

  const avgFullyLoadedCost =
    metrics.fullyLoadedCostPerRole.length > 0
      ? metrics.fullyLoadedCostPerRole.reduce(
          (sum, role) => sum + role.monthlyFullyLoadedCost,
          0
        ) / metrics.fullyLoadedCostPerRole.length
      : 0

  const runwayEndMonth =
    metrics.remainingRunwayMonths === Infinity
      ? null
      : Math.max(1, Math.floor(metrics.remainingRunwayMonths))

  const cards = React.useMemo(
    () => [
      {
        title: "Total monthly burn",
        numericValue: metrics.totalMonthlyBurn,
        isCurrency: true,
        description: "Existing burn + hiring burn - revenue",
      },
      {
        title: "Fully loaded cost / role",
        numericValue: avgFullyLoadedCost,
        isCurrency: true,
        description: "Avg. monthly cost per planned role",
      },
      {
        title: "Total annual hiring cost",
        numericValue: metrics.totalAnnualHiringCost,
        isCurrency: true,
        description: "Cumulative salaries + benefits + taxes",
      },
      {
        title: "Runway ends (month)",
        numericValue: runwayEndMonth,
        isCurrency: false,
        isSpecial: runwayEndMonth === null,
        specialValue: "No burn",
        description: "Based on current plan",
      },
      {
        title: "Remaining runway",
        numericValue:
          metrics.remainingRunwayMonths === Infinity
            ? null
            : metrics.remainingRunwayMonths,
        isCurrency: false,
        isSpecial: metrics.remainingRunwayMonths === Infinity,
        specialValue: "∞",
        suffix: "months",
        decimalPlaces: 1,
        description: "Cash ÷ total monthly burn",
      },
      {
        title: "Max hires (target runway)",
        numericValue: metrics.maxHiresForTargetRunway,
        isCurrency: false,
        description: "How many hires fit within runway goal",
      },
    ],
    [
      metrics.totalMonthlyBurn,
      metrics.totalAnnualHiringCost,
      metrics.remainingRunwayMonths,
      metrics.maxHiresForTargetRunway,
      avgFullyLoadedCost,
      runwayEndMonth,
    ]
  )

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const cardKey = card.title
        const currentValue = card.numericValue ?? 0
        const prevValue = prevValuesRef.current[cardKey] ?? currentValue

        // Update previous value after render for next animation
        if (card.numericValue !== null && !card.isSpecial) {
          if (prevValuesRef.current[cardKey] === undefined) {
            prevValuesRef.current[cardKey] = currentValue
          }
        }

        return (
          <KpiCard
            key={card.title}
            card={card}
            currentValue={currentValue}
            prevValue={prevValue}
            prevValuesRef={prevValuesRef}
          />
        )
      })}
    </div>
  )
}

function KpiCard({
  card,
  currentValue,
  prevValue,
  prevValuesRef,
}: {
  card: {
    title: string
    numericValue: number | null
    isCurrency: boolean
    isSpecial?: boolean
    specialValue?: string
    suffix?: string
    decimalPlaces?: number
    description: string
  }
  currentValue: number
  prevValue: number
  prevValuesRef: React.MutableRefObject<Record<string, number>>
}) {
  // Update previous value after component mounts/updates
  React.useEffect(() => {
    if (card.numericValue !== null && !card.isSpecial) {
      if (prevValuesRef.current[card.title] !== currentValue) {
        // Delay update to allow animation to start from previous value
        const timeoutId = setTimeout(() => {
          prevValuesRef.current[card.title] = currentValue
        }, 0)
        return () => clearTimeout(timeoutId)
      }
    }
  }, [card.title, card.numericValue, card.isSpecial, currentValue, prevValuesRef])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{card.title}</CardTitle>
        <CardDescription>{card.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold text-card-foreground">
          {card.isSpecial ? (
            <span>{card.specialValue}</span>
          ) : card.isCurrency ? (
            <>
              <span>$</span>
              <CountingNumber
                number={currentValue}
                fromNumber={prevValue}
                decimalPlaces={0}
              />
            </>
          ) : (
            <>
              <CountingNumber
                number={currentValue}
                fromNumber={prevValue}
                decimalPlaces={card.decimalPlaces ?? 0}
              />
              {card.suffix && <span> {card.suffix}</span>}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

