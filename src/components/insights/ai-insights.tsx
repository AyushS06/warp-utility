"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useCalculator } from "@/contexts/calculator-context"
import type { AIInsight, RoleInput } from "@/lib/types"
import { cn } from "@/lib/utils"
import { getMonthFromDate, parseMonthId } from "@/lib/months"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency"

function formatDate(monthsFromNow: number): string {
  const date = new Date()
  date.setMonth(date.getMonth() + monthsFromNow)
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

type InsightWithFormula = AIInsight & {
  formula?: string
}

function isDescriptorOnOrAfter(
  descriptor: { year: number; month: number },
  comparison: { year: number; month: number }
) {
  return (
    descriptor.year > comparison.year ||
    (descriptor.year === comparison.year && descriptor.month >= comparison.month)
  )
}

export function AIInsights() {
  const { state } = useCalculator()
  const metrics = state.metrics
  const financialInputs = state.financialInputs
  const roles = state.roles

  const formatCurrency = React.useCallback(
    (value: number) => formatCurrencyUtil(value, state.currency),
    [state.currency]
  )

  const getRoleMonthDescriptor = React.useCallback((role: RoleInput) => {
    if (role.monthPlacement) {
      return parseMonthId(role.monthPlacement)
    }
    if (role.hiringDate) {
      const parsed = new Date(role.hiringDate)
      if (!Number.isNaN(parsed.getTime())) {
        return getMonthFromDate(parsed)
      }
    }
    return null
  }, [])

  const monthsOfPlannedHiring = React.useMemo(() => {
    if (roles.length === 0) return 0
    const todayDescriptor = getMonthFromDate(new Date())
    const uniqueMonths = new Set<string>()
    roles.forEach((role) => {
      const descriptor = getRoleMonthDescriptor(role)
      if (descriptor && isDescriptorOnOrAfter(descriptor, todayDescriptor)) {
        uniqueMonths.add(`${descriptor.year}-${descriptor.month}`)
      }
    })
    return uniqueMonths.size
  }, [roles, getRoleMonthDescriptor])

  const insights = React.useMemo<InsightWithFormula[]>(() => {
    if (!metrics) {
      return []
    }

    const result: InsightWithFormula[] = []
    const personnelExpenses = metrics.expenseBreakdown.personnelExpenses
    const totalMonthlyIncome = metrics.incomeBreakdown.totalMonthlyCashIncome
    const totalMonthlyExpenses = metrics.expenseBreakdown.totalMonthlyCashExpenses
    const monthlyBurnDetailed = totalMonthlyExpenses - totalMonthlyIncome
    const cashRunwayDetailed =
      monthlyBurnDetailed > 0
        ? financialInputs.totalCashOnHand / monthlyBurnDetailed
        : Number.POSITIVE_INFINITY

    // Runway prediction (only show healthy runway, warnings are in RiskAlerts)
    const runwayMonths = metrics.remainingRunwayMonths
    if (runwayMonths !== Infinity && runwayMonths >= 18) {
      result.push({
        id: "runway-healthy",
        type: "success",
        title: "Healthy runway",
        description: `You have ${Math.round(runwayMonths)} months of runway, which meets your target.`,
        prediction: {
          label: "Projected cash-out date",
          value: formatDate(Math.round(runwayMonths)),
        },
      })
    }

    // Burn rate analysis
    const monthlyBurn = metrics.totalMonthlyBurn
    const annualBurn = monthlyBurn * 12
    const burnToCashRatio = (annualBurn / financialInputs.totalCashOnHand) * 100

    if (burnToCashRatio > 100) {
      result.push({
        id: "burn-high",
        type: "critical",
        title: "Burn rate exceeds cash",
        description: `Your annual burn rate (${formatCurrency(annualBurn)}) exceeds your current cash (${formatCurrency(financialInputs.totalCashOnHand)}).`,
        prediction: {
          label: "Annual burn rate",
          value: formatCurrency(annualBurn),
        },
        recommendation: "Reduce burn rate immediately or secure additional funding",
      })
    } else if (burnToCashRatio > 80) {
      result.push({
        id: "burn-warning",
        type: "warning",
        title: "High burn rate",
        description: `Your annual burn represents ${Math.round(burnToCashRatio)}% of your cash reserves.`,
        prediction: {
          label: "Annual burn rate",
          value: formatCurrency(annualBurn),
        },
        recommendation: "Monitor burn rate closely and consider cost optimization",
      })
    }

    // Hiring impact
    const totalHiringCost = metrics.totalAnnualHiringCost
    const hiringCostToCashRatio = (totalHiringCost / financialInputs.totalCashOnHand) * 100

    if (roles.length > 0 && hiringCostToCashRatio > 50) {
      result.push({
        id: "hiring-impact",
        type: "warning",
        title: "Significant hiring impact",
        description: `Your planned hiring will cost ${formatCurrency(totalHiringCost)} annually, representing ${Math.round(hiringCostToCashRatio)}% of your cash.`,
        prediction: {
          label: "Annual hiring cost",
          value: formatCurrency(totalHiringCost),
        },
        recommendation: "Consider staggering hires or reducing headcount to manage cash flow",
      })
    }

    // Revenue vs burn
    const monthlyRevenue = financialInputs.expectedMonthlyRevenue
    const revenueCoverage = monthlyRevenue > 0 ? (monthlyRevenue / monthlyBurn) * 100 : 0

    if (monthlyRevenue > 0 && revenueCoverage < 50) {
      result.push({
        id: "revenue-low",
        type: "info",
        title: "Revenue coverage low",
        description: `Current revenue covers only ${Math.round(revenueCoverage)}% of monthly burn.`,
        prediction: {
          label: "Revenue coverage",
          value: `${Math.round(revenueCoverage)}%`,
        },
        recommendation: "Focus on increasing revenue or reducing burn to improve sustainability",
      })
    } else if (monthlyRevenue > 0 && revenueCoverage >= 100) {
      result.push({
        id: "revenue-positive",
        type: "success",
        title: "Revenue positive",
        description: `Your revenue covers ${Math.round(revenueCoverage)}% of monthly burn.`,
        prediction: {
          label: "Revenue coverage",
          value: `${Math.round(revenueCoverage)}%`,
        },
      })
    }

    // Max hires analysis
    const maxHires = metrics.maxHiresForTargetRunway
    const currentHires = roles.reduce((sum, role) => sum + role.headcount, 0)

    if (currentHires > maxHires && maxHires > 0) {
      result.push({
        id: "hires-exceed",
        type: "warning",
        title: "Hiring plan exceeds capacity",
        description: `You've planned ${currentHires} hires, but only ${maxHires} fit within your ${financialInputs.targetRunwayMonths}-month runway target.`,
        prediction: {
          label: "Max hires for target runway",
          value: maxHires,
          unit: "people",
        },
        recommendation: "Reduce headcount or extend runway to accommodate all planned hires",
      })
    }

    // Headcount cost-to-income ratio
    if (personnelExpenses > 0 && totalMonthlyIncome > 0) {
      const ratio = personnelExpenses / totalMonthlyIncome
      const ratioPercent = Math.round(ratio * 100)
      let ratioType: AIInsight["type"] = "info"
      if (ratioPercent >= 90) {
        ratioType = "critical"
      } else if (ratioPercent >= 70) {
        ratioType = "warning"
      } else if (ratioPercent <= 40) {
        ratioType = "success"
      }
      result.push({
        id: "headcount-cost-income",
        type: ratioType,
        title: "Headcount cost-to-income ratio",
        description: `Personnel spend is consuming ${ratioPercent}% of monthly cash income.`,
        prediction: {
          label: "Cost-to-income",
          value: `${ratioPercent}%`,
        },
        formula: "HCIR = Projected Personnel Expenses ÷ Total Monthly Cash Income",
        recommendation:
          ratioPercent >= 70
            ? "Slow new hiring or accelerate revenue to rebalance the ratio"
            : undefined,
      })
    }

    // Hiring capacity alert
    if (monthsOfPlannedHiring > 0 && cashRunwayDetailed !== Infinity) {
      const runwayAfterHiringPlan = cashRunwayDetailed - monthsOfPlannedHiring
      const runwayIsTight = runwayAfterHiringPlan < 6
      result.push({
        id: "hiring-capacity-alert",
        type: runwayIsTight ? "warning" : "success",
        title: "Hiring capacity check",
        description: runwayIsTight
          ? `Delaying ${monthsOfPlannedHiring} months of planned hires would keep less than 6 months of cash runway.`
          : `Your ${monthsOfPlannedHiring}-month hiring plan still leaves ${Math.max(0, Math.round(runwayAfterHiringPlan))} months of cushion.`,
        prediction: {
          label: "Runway after plan",
          value:
            runwayAfterHiringPlan === Infinity
              ? "∞"
              : `${Math.max(0, Math.round(runwayAfterHiringPlan))} mo`,
        },
        formula:
          "Alert = IF(Cash Runway Detailed − Months of Planned Hiring < 6, “Low Capacity”, “OK”)",
        recommendation: runwayIsTight
          ? "Revisit the hiring schedule or increase cash reserves to keep at least 6 months of runway"
          : undefined,
      })
    }

    // Average cost per hire
    if (currentHires > 0 && metrics.totalAnnualHiringCost > 0) {
      const averageAnnualCost = metrics.totalAnnualHiringCost / currentHires
      result.push({
        id: "average-cost-per-hire",
        type: "info",
        title: "Average cost per hire",
        description: "Quick benchmark for budgeting upcoming hires.",
        prediction: {
          label: "Avg annual cost",
          value: formatCurrency(Math.round(averageAnnualCost)),
        },
      })
    }

    // Burn rate trend indicator
    const priorBurnAverage =
      typeof metrics.coreBurn.averageMonthlyBurnSimple === "number" &&
      (metrics.coreBurn.monthsInPeriod ?? 0) >= 3
        ? metrics.coreBurn.averageMonthlyBurnSimple
        : null

    if (typeof priorBurnAverage === "number" && priorBurnAverage > 0) {
      const burnDelta = monthlyBurnDetailed - priorBurnAverage
      const burnDeltaPercent = (burnDelta / priorBurnAverage) * 100
      let trend: "Improving" | "Worsening" | "Stable" = "Stable"
      let trendType: AIInsight["type"] = "info"
      if (burnDeltaPercent <= -5) {
        trend = "Improving"
        trendType = "success"
      } else if (burnDeltaPercent >= 5) {
        trend = "Worsening"
        trendType = "warning"
      }

      result.push({
        id: "burn-trend-indicator",
        type: trendType,
        title: "Burn rate trend",
        description: `Current burn is ${Math.abs(Math.round(burnDeltaPercent))}% ${
          burnDeltaPercent >= 0 ? "higher" : "lower"
        } than the recent average.`,
        prediction: {
          label: "Trend",
          value: trend,
        },
        formula:
          "BRTI compares current Monthly Burn Rate to Avg(Monthly Burn of last 3 months) with a ±5% tolerance.",
        recommendation:
          trend === "Worsening"
            ? "Double-check hiring cadence or expenses before the trend accelerates"
            : undefined,
      })
    }

    return result
  }, [metrics, financialInputs, roles, monthsOfPlannedHiring, formatCurrency])

  const getIcon = (type: AIInsight["type"]) => {
    switch (type) {
      case "critical":
        return <AlertCircle className="h-5 w-5" />
      case "warning":
        return <AlertTriangle className="h-5 w-5" />
      case "success":
        return <CheckCircle2 className="h-5 w-5" />
      case "info":
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getBadgeVariant = (type: AIInsight["type"]) => {
    switch (type) {
      case "critical":
        return "destructive" as const
      case "warning":
        return "secondary" as const
      case "success":
        return "default" as const
      case "info":
      default:
        return "outline" as const
    }
  }

  // Separate insights into alerts (critical/warning), info, and success
  // Sort so critical alerts come first, then warnings
  const alertInsights = React.useMemo(() => {
    const critical = insights.filter((insight) => insight.type === "critical")
    const warnings = insights.filter((insight) => insight.type === "warning")
    return [...critical, ...warnings]
  }, [insights])
  const infoInsights = React.useMemo(() => {
    return insights.filter((insight) => insight.type === "info")
  }, [insights])
  const successInsights = React.useMemo(() => {
    return insights.filter((insight) => insight.type === "success")
  }, [insights])

  // State to track selected alert index
  const [selectedAlertIndex, setSelectedAlertIndex] = React.useState(0)
  // State to track selected info index
  const [selectedInfoIndex, setSelectedInfoIndex] = React.useState(0)

  // Ensure selected index is valid when alerts change
  React.useEffect(() => {
    setSelectedAlertIndex((prevIndex) => {
      if (alertInsights.length > 0 && prevIndex >= alertInsights.length) {
        return 0
      }
      return prevIndex
    })
  }, [alertInsights.length])

  // Ensure selected index is valid when info insights change
  React.useEffect(() => {
    setSelectedInfoIndex((prevIndex) => {
      if (infoInsights.length > 0 && prevIndex >= infoInsights.length) {
        return 0
      }
      return prevIndex
    })
  }, [infoInsights.length])

  const handlePreviousAlert = () => {
    setSelectedAlertIndex((prev) => (prev > 0 ? prev - 1 : alertInsights.length - 1))
  }

  const handleNextAlert = () => {
    setSelectedAlertIndex((prev) => (prev < alertInsights.length - 1 ? prev + 1 : 0))
  }

  const handlePreviousInfo = () => {
    setSelectedInfoIndex((prev) => (prev > 0 ? prev - 1 : infoInsights.length - 1))
  }

  const handleNextInfo = () => {
    setSelectedInfoIndex((prev) => (prev < infoInsights.length - 1 ? prev + 1 : 0))
  }

  const renderInsightCard = (insight: InsightWithFormula) => {
    const card = (
    <Card
      key={insight.id}
      className={cn(
        "border-l-4",
        insight.type === "critical" && "border-l-destructive",
        insight.type === "warning" && "border-l-yellow-500",
        insight.type === "success" && "border-l-green-500",
        insight.type === "info" && "border-l-blue-500"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "mt-0.5",
                insight.type === "critical" && "text-destructive",
                insight.type === "warning" && "text-yellow-600 dark:text-yellow-500",
                insight.type === "success" && "text-green-600 dark:text-green-500",
                insight.type === "info" && "text-blue-600 dark:text-blue-500"
              )}
            >
              {getIcon(insight.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base">{insight.title}</CardTitle>
                <Badge variant={getBadgeVariant(insight.type)} className="text-xs">
                  {insight.type}
                </Badge>
              </div>
              <CardDescription className="text-sm">
                {insight.description}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {insight.prediction && (
          <div className="p-3 bg-muted rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {insight.prediction.label}
              </span>
              <span className="text-lg font-semibold">
                {typeof insight.prediction.value === "number"
                  ? insight.prediction.value.toLocaleString()
                  : insight.prediction.value}
                {insight.prediction.unit && (
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {insight.prediction.unit}
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
        {insight.recommendation && (
          <div className="p-3 bg-muted/50 rounded-md border-l-2 border-primary">
            <p className="text-sm font-medium mb-1">Recommendation:</p>
            <p className="text-sm text-muted-foreground">
              {insight.recommendation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )

    if (!insight.formula) {
      return card
    }

    return (
      <Tooltip key={insight.id}>
        <TooltipTrigger asChild>{card}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-sm !bg-popover !text-popover-foreground border border-border shadow-lg px-4 py-3"
          sideOffset={8}
        >
          <div className="space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Calculation Formula
            </div>
            <div className="text-sm font-mono leading-relaxed break-words">
              {insight.formula}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent>
          {insights.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Add financial inputs and roles to see AI-powered insights and predictions.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Alerts Section - Collapsible with cycling */}
              {alertInsights.length > 0 && (
              <Accordion type="single" collapsible defaultValue="alerts" className="w-full">
                <AccordionItem value="alerts" className="border-none">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        Alerts & Warnings
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {alertInsights.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {/* Display selected alert */}
                      {alertInsights[selectedAlertIndex] && (
                        <div className="relative">
                          {renderInsightCard(alertInsights[selectedAlertIndex])}
                          {/* Navigation controls */}
                          {alertInsights.length > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePreviousAlert}
                                className="gap-2"
                              >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                              </Button>
                              <span className="text-sm text-muted-foreground">
                                {selectedAlertIndex + 1} of {alertInsights.length}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextAlert}
                                className="gap-2"
                              >
                                Next
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {/* Info Section - Collapsible with cycling */}
            {infoInsights.length > 0 && (
              <Accordion type="single" collapsible defaultValue="info" className="w-full">
                <AccordionItem value="info" className="border-none">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        Info
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {infoInsights.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {/* Display selected info insight */}
                      {infoInsights[selectedInfoIndex] && (
                        <div className="relative">
                          {renderInsightCard(infoInsights[selectedInfoIndex])}
                          {/* Navigation controls */}
                          {infoInsights.length > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePreviousInfo}
                                className="gap-2"
                              >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                              </Button>
                              <span className="text-sm text-muted-foreground">
                                {selectedInfoIndex + 1} of {infoInsights.length}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextInfo}
                                className="gap-2"
                              >
                                Next
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

              {/* Success insights */}
              {successInsights.length > 0 && (
                <div className="space-y-4">
                  {successInsights.map((insight) => renderInsightCard(insight))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

