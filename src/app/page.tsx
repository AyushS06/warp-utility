"use client"

import * as React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CalculatorFormDialog } from "@/components/calculator/calculator-form"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { SensitivityCharts } from "@/components/dashboard/sensitivity-charts"
import { RiskAlerts } from "@/components/dashboard/risk-alerts"
import { HiringOverviewTable } from "@/components/dashboard/hiring-table"
import { useCalculator } from "@/contexts/calculator-context"
import { RotateCcw, Plus } from "lucide-react"
import { CountingNumber } from "@/components/ui/shadcn-io/counting-number"

export default function Home() {
  const { state, plannerOpen, setPlannerOpen, resetCalculator } = useCalculator()
  const [resetDialogOpen, setResetDialogOpen] = React.useState(false)
  const prevFinancialInputsRef = React.useRef(state.financialInputs)

  const handleReset = () => {
    resetCalculator()
    setResetDialogOpen(false)
  }

  // Update previous values after state changes
  React.useEffect(() => {
    prevFinancialInputsRef.current = state.financialInputs
  }, [state.financialInputs])

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Headcount planner</h1>
            <p className="text-muted-foreground">Build scenarios and watch runway updates in real-time.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setResetDialogOpen(true)}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              size="icon"
              title="Create headcount report"
              onClick={() => setPlannerOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">Create headcount report</span>
            </Button>
          </div>
        </div>

        <RiskAlerts />
        <KpiCards />

        <Card>
          <CardHeader>
            <CardTitle>Current inputs</CardTitle>
            <CardDescription>Financial assumptions for this scenario</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Cash on hand"
                value={state.financialInputs.totalCashOnHand}
                prefix="$"
                prevValue={prevFinancialInputsRef.current.totalCashOnHand}
              />
              <Metric
                label="Existing burn"
                value={state.financialInputs.monthlyExistingBurn}
                prefix="$"
                suffix="/mo"
                prevValue={prevFinancialInputsRef.current.monthlyExistingBurn}
              />
              <Metric
                label="Expected revenue"
                value={state.financialInputs.expectedMonthlyRevenue}
                prefix="$"
                suffix="/mo"
                prevValue={prevFinancialInputsRef.current.expectedMonthlyRevenue}
              />
              <Metric
                label="Runway target"
                value={state.financialInputs.targetRunwayMonths}
                suffix="months"
                prevValue={prevFinancialInputsRef.current.targetRunwayMonths}
              />
            </div>
          </CardContent>
        </Card>

        <SensitivityCharts />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Hiring plan</h2>
            <Button variant="outline" onClick={() => setPlannerOpen(true)}>
              Edit plan
            </Button>
          </div>
          {state.roles.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">
                  No roles added yet. Use the planner to add roles and project hiring costs.
                </p>
                <Button className="mt-4" onClick={() => setPlannerOpen(true)}>
                  Start planning
                </Button>
              </CardContent>
            </Card>
          ) : (
            <HiringOverviewTable />
          )}
        </div>
      </div>

      <CalculatorFormDialog open={plannerOpen} onOpenChange={setPlannerOpen} />

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset calculator</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset all calculator data? This will clear all financial inputs, roles, and settings. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Metric({
  label,
  value,
  prefix,
  suffix,
  prevValue,
}: {
  label: string
  value: number
  prefix?: string
  suffix?: string
  prevValue?: number
}) {
  const fromValue = prevValue ?? value

  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold text-card-foreground">
        {prefix}
        <CountingNumber
          number={value}
          fromNumber={fromValue}
          decimalPlaces={prefix ? 0 : 1}
        />
        {suffix ? ` ${suffix}` : ""}
      </p>
    </div>
  )
}
