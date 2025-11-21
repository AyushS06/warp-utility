"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalculator } from "@/contexts/calculator-context"
import { Share2 } from "lucide-react"
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency"

function formatNumber(value: number, decimals = 1) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
  }).format(value)
}

interface ExportPdfPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportPdfPreview({ open, onOpenChange }: ExportPdfPreviewProps) {
  const { state } = useCalculator()
  const metrics = state.metrics
  
  const formatCurrency = React.useCallback(
    (value: number) => formatCurrencyUtil(value, state.currency),
    [state.currency]
  )

  const handleShare = () => {
    window.location.href = "https://www.joinwarp.com/qualification"
  }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>PDF Preview</DialogTitle>
          <DialogDescription>
            Sign up with warp to share your report with your team!
          </DialogDescription>
        </DialogHeader>

        {/* PDF Preview Content */}
        <div className="bg-white dark:bg-card rounded-lg border-2 border-border shadow-lg p-12">
          {/* Header */}
          <div className="mb-8 pb-6 border-b border-border">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Headcount Planner Report
            </h1>
            <p className="text-sm text-muted-foreground">
              Generated on {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Financial Summary */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Financial Summary
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Cash on Hand</p>
                <p className="text-xl font-semibold text-foreground">
                  {formatCurrency(state.financialInputs.totalCashOnHand)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Company Valuation</p>
                <p className="text-xl font-semibold text-foreground">
                  {formatCurrency(state.financialInputs.companyValuation)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Existing Burn</p>
                <p className="text-xl font-semibold text-foreground">
                  {formatCurrency(state.financialInputs.monthlyExistingBurn)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expected Monthly Revenue</p>
                <p className="text-xl font-semibold text-foreground">
                  {formatCurrency(state.financialInputs.expectedMonthlyRevenue)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target Runway</p>
                <p className="text-xl font-semibold text-foreground">
                  {formatNumber(state.financialInputs.targetRunwayMonths, 0)} months
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contingency Buffer</p>
                <p className="text-xl font-semibold text-foreground">
                  {formatNumber(state.financialInputs.contingencyBufferPercent, 0)}%
                </p>
              </div>
            </div>
          </section>

          {/* Key Metrics */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Key Metrics
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded">
                <p className="text-sm text-muted-foreground mb-1">Total Monthly Burn</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(metrics.totalMonthlyBurn)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Existing burn + hiring burn - revenue
                </p>
              </div>
              <div className="p-4 bg-muted rounded">
                <p className="text-sm text-muted-foreground mb-1">
                  Fully Loaded Cost / Role
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(avgFullyLoadedCost)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg. monthly cost per planned role
                </p>
              </div>
              <div className="p-4 bg-muted rounded">
                <p className="text-sm text-muted-foreground mb-1">
                  Total Annual Hiring Cost
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(metrics.totalAnnualHiringCost)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cumulative salaries + benefits + taxes
                </p>
              </div>
              <div className="p-4 bg-muted rounded">
                <p className="text-sm text-muted-foreground mb-1">Remaining Runway</p>
                <p className="text-2xl font-bold text-foreground">
                  {metrics.remainingRunwayMonths === Infinity
                    ? "∞"
                    : `${formatNumber(metrics.remainingRunwayMonths, 1)} months`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cash ÷ total monthly burn
                </p>
              </div>
              {runwayEndMonth && (
                <div className="p-4 bg-muted rounded">
                  <p className="text-sm text-muted-foreground mb-1">
                    Runway Ends (Month)
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    Month {runwayEndMonth}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on current plan
                  </p>
                </div>
              )}
              <div className="p-4 bg-muted rounded">
                <p className="text-sm text-muted-foreground mb-1">
                  Max Hires (Target Runway)
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatNumber(metrics.maxHiresForTargetRunway, 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  How many hires fit within runway goal
                </p>
              </div>
            </div>
          </section>

          {/* Hiring Plan */}
          {state.roles.length > 0 && (
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Hiring Plan
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-300 dark:border-gray-700">
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Role
                      </th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Location
                      </th>
                      <th className="text-right py-2 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Headcount
                      </th>
                      <th className="text-right py-2 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Base Salary
                      </th>
                      <th className="text-right py-2 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Monthly Cost
                      </th>
                      <th className="text-right py-2 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Annual Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.roles.map((role) => {
                      const roleCost = metrics.fullyLoadedCostPerRole.find(
                        (r) => r.roleId === role.id
                      )
                      const location = state.locations.find((loc) => loc.id === role.locationId)

                      return (
                        <tr
                          key={role.id}
                          className="border-b border-gray-200 dark:border-gray-800"
                        >
                          <td className="py-2 px-4 text-sm text-gray-900 dark:text-gray-100">
                            {role.title}
                          </td>
                          <td className="py-2 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {location?.label || "Unknown"}
                          </td>
                          <td className="py-2 px-4 text-sm text-right text-gray-900 dark:text-gray-100">
                            {role.headcount}
                          </td>
                          <td className="py-2 px-4 text-sm text-right text-gray-900 dark:text-gray-100">
                            {formatCurrency(role.baseSalary)}
                          </td>
                          <td className="py-2 px-4 text-sm text-right text-gray-900 dark:text-gray-100">
                            {roleCost
                              ? formatCurrency(roleCost.monthlyFullyLoadedCost * role.headcount)
                              : "-"}
                          </td>
                          <td className="py-2 px-4 text-sm text-right text-gray-900 dark:text-gray-100">
                            {roleCost
                              ? formatCurrency(roleCost.annualFullyLoadedCost * role.headcount)
                              : "-"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

