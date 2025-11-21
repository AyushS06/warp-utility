"use client"

import * as React from "react"
import { useForm, useWatch, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { FinancialInputsSection } from "@/components/calculator/financial-inputs"
import { SectionAccordion } from "@/components/dashboard/section-accordion"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { BurnMetricsSummary } from "@/components/dashboard/burn-metrics-summary"
import { SensitivityCharts } from "@/components/dashboard/sensitivity-charts"
import { RiskAlerts } from "@/components/dashboard/risk-alerts"
import { HiringOverviewTable } from "@/components/dashboard/hiring-table"
import { AIInsights } from "@/components/insights/ai-insights"
import { ScenarioSimulator } from "@/components/scenarios/scenario-simulator"
import { useCalculator } from "@/contexts/calculator-context"
import { RotateCcw, Download, Star, Plus } from "lucide-react"
import { calculatorFormSchema, type CalculatorFormValues } from "@/lib/schemas/calculator"
import { AddRoleForm } from "@/components/hiring/add-role-form"
import { MonthlyHiringBoard } from "@/components/hiring/monthly-board"
import { ExportPdfPreview } from "@/components/export-pdf-preview"
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency"

export default function Home() {
  const { state, setFinancialInputs, setScenario, resetCalculator } = useCalculator()
  const [resetDialogOpen, setResetDialogOpen] = React.useState(false)
  const [addRoleDialogOpen, setAddRoleDialogOpen] = React.useState(false)
  const [exportPdfPreviewOpen, setExportPdfPreviewOpen] = React.useState(false)
  
  // Track starred (output) metrics for each section
  const [starredMetrics, setStarredMetrics] = React.useState<Record<string, string | null>>({
    core: null,
    income: null,
    expenses: null,
    projection: null,
  })
  
  const toggleStarMetric = React.useCallback((section: string, metricKey: string | null) => {
    setStarredMetrics((prev) => {
      // If clicking the same starred metric, unstar it
      if (prev[section] === metricKey) {
        return { ...prev, [section]: null }
      }
      // Otherwise, star the new metric
      return { ...prev, [section]: metricKey }
    })
  }, [])
  
  // Get starred metric details for display - will be defined after financialPreview
  const getStarredMetric = React.useCallback((
    section: string,
    preview: {
      core: FinancialMetricDefinition[]
      income: FinancialMetricDefinition[]
      expenses: FinancialMetricDefinition[]
      projection: FinancialMetricDefinition[]
    }
  ) => {
    const starredKey = starredMetrics[section]
    if (!starredKey) return null
    
    const sectionMetrics = {
      core: preview.core,
      income: preview.income,
      expenses: preview.expenses,
      projection: preview.projection,
    }[section]
    
    return sectionMetrics?.find((m: FinancialMetricDefinition) => m.key === starredKey) || null
  }, [starredMetrics])
  
  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorFormSchema) as Resolver<CalculatorFormValues>,
    defaultValues: {
      financialInputs: state.financialInputs,
      locations: state.locations,
      roles: state.roles,
      scenario: state.scenario,
    },
    mode: "onBlur",
  })

  // Use useWatch hook instead of form.watch for consistent hook ordering
  const watchedFinancialInputs = useWatch({
    control: form.control,
    name: "financialInputs",
  })
  
  // Use useMemo to ensure stable reference
  const financialInputsLive = React.useMemo(
    () => watchedFinancialInputs ?? state.financialInputs,
    [watchedFinancialInputs, state.financialInputs]
  )
  
  const personnelExpenses = React.useMemo(
    () => state.metrics?.totalMonthlyHireBurn ?? 0,
    [state.metrics?.totalMonthlyHireBurn]
  )

  const financialPreview = React.useMemo<{
    core: FinancialMetricDefinition[]
    income: FinancialMetricDefinition[]
    expenses: FinancialMetricDefinition[]
    projection: FinancialMetricDefinition[]
  }>(() => {
    const parseDate = (value?: string | null) => {
      if (!value) return null
      const parsed = new Date(value)
      return Number.isNaN(parsed.getTime()) ? null : parsed
    }

    const periodStart = parseDate(financialInputsLive.periodStartDate)
    const periodEnd = parseDate(financialInputsLive.periodEndDate)

    const monthsInPeriod =
      periodStart && periodEnd && periodEnd.getTime() >= periodStart.getTime()
        ? (periodEnd.getTime() - periodStart.getTime()) /
          (1000 * 60 * 60 * 24) /
          30.44
        : null

    const averageMonthlyBurnSimple =
      monthsInPeriod && monthsInPeriod > 0
        ? (financialInputsLive.startingCashBalance -
            financialInputsLive.endingCashBalance) /
          monthsInPeriod
        : null

    const cashRunwaySimple =
      averageMonthlyBurnSimple === null
        ? null
        : averageMonthlyBurnSimple <= 0
        ? Number.POSITIVE_INFINITY
        : financialInputsLive.startingCashBalance / averageMonthlyBurnSimple

    const totalMonthlyCashIncome =
      financialInputsLive.monthlyCashSales +
      financialInputsLive.otherMonthlyCashIncome

    const totalMonthlyCashExpenses =
      personnelExpenses +
      financialInputsLive.rentAndUtilities +
      financialInputsLive.officeSuppliesAndEquipment +
      financialInputsLive.marketingExpenses +
      financialInputsLive.travelExpenses +
      financialInputsLive.otherCashExpenses

    const monthlyBurnRateDetailed =
      totalMonthlyCashExpenses - totalMonthlyCashIncome

    const cashRunwayDetailed =
      monthlyBurnRateDetailed === 0
        ? null
        : monthlyBurnRateDetailed < 0
        ? Number.POSITIVE_INFINITY
        : financialInputsLive.totalCashOnHand / monthlyBurnRateDetailed

    return {
      core: [
        {
          key: "scb",
          label: "Starting cash balance",
          description: "Cash at start of analysis period (input).",
          value: financialInputsLive.startingCashBalance,
          format: "currency",
          metricType: "Input",
        },
        {
          key: "ecb",
          label: "Ending cash balance",
          description: "Cash at end of analysis period (input).",
          value: financialInputsLive.endingCashBalance,
          format: "currency",
          metricType: "Input",
        },
        {
          key: "mip",
          label: "Months in period",
          description: "Calculated from period start/end dates.",
          value: monthsInPeriod,
          format: "months",
          metricType: "Calculated",
          decimalPlaces: 2,
          formula: "(End Date - Start Date) days ÷ 30.44",
        },
        {
          key: "ambr",
          label: "Average monthly burn (simple)",
          description: "Based on change in cash over the selected period.",
          value: averageMonthlyBurnSimple,
          format: "currency",
          metricType: "Calculated",
          formula: "(Starting Cash Balance - Ending Cash Balance) ÷ Months in Period",
        },
        {
          key: "crs",
          label: "Cash runway (simple)",
          description: "Starting cash ÷ average monthly burn.",
          value: cashRunwaySimple,
          format: "months",
          metricType: "Calculated",
          decimalPlaces: 1,
          formula: "Starting Cash Balance ÷ Average Monthly Burn (Simple)",
        },
      ],
      income: [
        {
          key: "mcs",
          label: "Monthly cash sales",
          description: "Recurring cash inflows from sales (input).",
          value: financialInputsLive.monthlyCashSales,
          format: "currency",
          metricType: "Input",
        },
        {
          key: "omci",
          label: "Other monthly cash income",
          description: "Non-sales inflows such as grants or interest.",
          value: financialInputsLive.otherMonthlyCashIncome,
          format: "currency",
          metricType: "Input",
        },
        {
          key: "tmci",
          label: "Total monthly cash income",
          description: "Monthly cash sales + other cash income.",
          value: totalMonthlyCashIncome,
          format: "currency",
          metricType: "Calculated",
          formula: "Monthly Cash Sales + Other Monthly Cash Income",
        },
      ],
      expenses: [
        {
          key: "pe",
          label: "Personnel expenses",
          description: "Fully-loaded cost of planned headcount.",
          value: personnelExpenses,
          format: "currency",
          metricType: "Calculated",
          formula: "Sum(Monthly Fully Loaded Cost) for all roles",
        },
        {
          key: "ru",
          label: "Rent & utilities",
          description: "Office rent, electricity, internet, etc.",
          value: financialInputsLive.rentAndUtilities,
          format: "currency",
          metricType: "Input",
        },
        {
          key: "ose",
          label: "Office supplies & equipment",
          description: "Consumables and hardware purchases.",
          value: financialInputsLive.officeSuppliesAndEquipment,
          format: "currency",
          metricType: "Input",
        },
        {
          key: "me",
          label: "Marketing expenses",
          description: "Campaign and advertising spend.",
          value: financialInputsLive.marketingExpenses,
          format: "currency",
          metricType: "Input",
        },
        {
          key: "travel",
          label: "Travel",
          description: "Flights, lodging, and per diem.",
          value: financialInputsLive.travelExpenses,
          format: "currency",
          metricType: "Input",
        },
        {
          key: "oce",
          label: "Other cash expenses",
          description: "Software, legal, and other operating spend.",
          value: financialInputsLive.otherCashExpenses,
          format: "currency",
          metricType: "Input",
        },
        {
          key: "tmce",
          label: "Total monthly cash expenses",
          description: "Personnel + rent + supplies + marketing + travel + other.",
          value: totalMonthlyCashExpenses,
          format: "currency",
          metricType: "Calculated",
          formula: "Personnel + Rent & Utilities + Supplies + Marketing + Travel + Other Expenses",
        },
      ],
      projection: [
        {
          key: "mbr",
          label: "Monthly burn rate (detailed)",
          description: "Total monthly expenses - total monthly income.",
          value: monthlyBurnRateDetailed,
          format: "currency",
          metricType: "Calculated",
          formula: "Total Monthly Cash Expenses - Total Monthly Cash Income",
        },
        {
          key: "coh",
          label: "Cash on hand",
          description: "Current cash balance for runway calculation (input).",
          value: financialInputsLive.totalCashOnHand,
          format: "currency",
          metricType: "Input",
        },
        {
          key: "crd",
          label: "Cash runway (detailed)",
          description: "Cash on hand ÷ monthly burn rate.",
          value: cashRunwayDetailed,
          format: "months",
          metricType: "Calculated",
          decimalPlaces: 1,
          formula: "Cash On Hand ÷ Monthly Burn Rate (Detailed)",
        },
      ],
    }
  }, [financialInputsLive, personnelExpenses])

  React.useEffect(() => {
    form.reset({
      financialInputs: state.financialInputs,
      locations: state.locations,
      roles: state.roles,
      scenario: state.scenario,
    })
  }, [state.financialInputs, state.locations, state.roles, state.scenario, form])

  const handleSaveFinancials = React.useMemo(
    () =>
      form.handleSubmit((values) => {
        setFinancialInputs(values.financialInputs)
      }),
    [form, setFinancialInputs]
  )

  const handleReset = () => {
    resetCalculator()
    setResetDialogOpen(false)
  }

  const financialSectionContent = (
    <>
      <form onSubmit={handleSaveFinancials} className="space-y-6">
        <FinancialInputsSection form={form} />
        
        <Card>
          <CardHeader>
            <CardTitle>Financial metrics preview</CardTitle>
            <CardDescription>Live calculations that update with the inputs above.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Display starred metrics as large cards */}
            {Object.entries(starredMetrics).some(([_, key]) => key !== null) && (
              <div className="space-y-4 pb-4 border-b">
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(starredMetrics).map(([section, starredKey]) => {
                    if (!starredKey) return null
                    const metric = getStarredMetric(section, financialPreview)
                    if (!metric) return null
                    return (
                      <StarredMetricCard
                        key={`${section}-${starredKey}`}
                        metric={metric}
                        sectionTitle={
                          section === "core" ? "Core burn rate metrics" :
                          section === "income" ? "Monthly income" :
                          section === "expenses" ? "Monthly expenses" :
                          "Detailed burn projection"
                        }
                        onUnstar={() => toggleStarMetric(section, null)}
                      />
                    )
                  })}
                </div>
              </div>
            )}
            
            <Accordion type="multiple" className="space-y-4">
              <FinancialMetricsSection
                title="Core burn rate metrics"
                sectionKey="core"
                metrics={financialPreview.core}
                starredMetric={starredMetrics.core}
                onToggleStar={(metricKey) => toggleStarMetric("core", metricKey)}
              />
              <FinancialMetricsSection
                title="Monthly income (cash inflows)"
                sectionKey="income"
                metrics={financialPreview.income}
                starredMetric={starredMetrics.income}
                onToggleStar={(metricKey) => toggleStarMetric("income", metricKey)}
              />
              <FinancialMetricsSection
                title="Monthly expenses (cash outflows)"
                sectionKey="expenses"
                metrics={financialPreview.expenses}
                starredMetric={starredMetrics.expenses}
                onToggleStar={(metricKey) => toggleStarMetric("expenses", metricKey)}
              />
              <FinancialMetricsSection
                title="Detailed burn projection"
                sectionKey="projection"
                metrics={financialPreview.projection}
                starredMetric={starredMetrics.projection}
                onToggleStar={(metricKey) => toggleStarMetric("projection", metricKey)}
              />
            </Accordion>
          </CardContent>
        </Card>

      </form>
    </>
  )

  const hiringSectionContent = (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            onClick={() => setAddRoleDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add role
          </Button>
        </div>
        {state.roles.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground mb-4">
                No roles added yet. Click the button above to start building your hiring plan.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <HiringOverviewTable />
            <MonthlyHiringBoard />
          </div>
        )}
      </div>
    </>
  )

  const insightsSectionContent = (
    <>
      <AIInsights />
      <RiskAlerts />
      <KpiCards />
      <BurnMetricsSummary />
      <SensitivityCharts />
    </>
  )

  const scenariosSectionContent = (
    <>
      <ScenarioSimulator />
    </>
  )

  const sections = [
    {
      id: "financials",
      title: "Financial inputs",
      description: "Start with current cash, burn, and runway goals.",
      content: financialSectionContent,
      defaultOpen: true,
    },
    {
      id: "hiring",
      title: "Hiring plan",
      description: "Plan roles, locations, and compensation.",
      content: hiringSectionContent,
      defaultOpen: true,
    },
    {
      id: "insights",
      title: "AI Insights",
      description: "Predictive analysis and recommendations based on your financial data.",
      content: insightsSectionContent,
      defaultOpen: true,
    },
    {
      id: "scenarios",
      title: "Scenarios",
      description: "Simulate fundraising, growth, and burn rate scenarios.",
      content: scenariosSectionContent,
      defaultOpen: true,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Headcount planner</h1>
            <p className="text-muted-foreground">Build scenarios and watch runway updates in real-time.</p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setExportPdfPreviewOpen(true)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export as PDF</p>
              </TooltipContent>
            </Tooltip>
            <Button
              variant="outline"
              onClick={() => setResetDialogOpen(true)}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        <Form {...form}>
          <SectionAccordion sections={sections} />
        </Form>
      </div>

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

      <AddRoleForm
        open={addRoleDialogOpen}
        onOpenChange={setAddRoleDialogOpen}
        defaultLocationId={state.locations[0]?.id}
      />

      <ExportPdfPreview
        open={exportPdfPreviewOpen}
        onOpenChange={setExportPdfPreviewOpen}
      />
    </div>
  )
}

type FinancialMetricDefinition = {
  key: string
  label: string
  description: string
  value: number | null
  format: "currency" | "number" | "months"
  metricType: "Input" | "Calculated"
  decimalPlaces?: number
  formula?: string
}

function formatFinancialMetricValue(
  value: number | null,
  format: "currency" | "number" | "months",
  currency: "USD" | "GBP" | "INR" | "EUR" | "JPY" | "CAD" | "AUD" = "USD",
  decimalPlaces = format === "currency" ? 0 : 2
) {
  if (value === null || Number.isNaN(value)) {
    return "—"
  }

  if (!Number.isFinite(value)) {
    return "∞"
  }

  if (format === "currency") {
    return formatCurrencyUtil(value, currency)
  }

  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  })

  const formatted = formatter.format(value)

  if (format === "months") {
    return `${formatted} mo`
  }

  return formatted
}

function FinancialMetricsSection({
  title,
  sectionKey,
  metrics,
  starredMetric,
  onToggleStar,
}: {
  title: string
  sectionKey: string
  metrics: FinancialMetricDefinition[]
  starredMetric: string | null
  onToggleStar: (key: string | null) => void
}) {
  return (
    <AccordionItem value={sectionKey} className="border-none">
      <AccordionTrigger className="py-3 hover:no-underline">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          {starredMetric && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0">
              Output selected
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-2 pt-2">
          {metrics.map((metric) => (
            <FinancialMetricRow
              key={metric.key}
              metric={metric}
              isStarred={starredMetric === metric.key}
              onToggleStar={() => onToggleStar(starredMetric === metric.key ? null : metric.key)}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

function FinancialMetricRow({
  metric,
  isStarred,
  onToggleStar,
}: {
  metric: FinancialMetricDefinition
  isStarred: boolean
  onToggleStar: () => void
}) {
  const { state } = useCalculator()
  const content = (
    <div className={`flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between cursor-help transition-colors ${
      isStarred 
        ? "border-primary/50 bg-primary/5 border-2" 
        : "border-border/60 bg-muted/20"
    }`}>
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleStar()
          }}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border transition-colors ${
            isStarred
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border/60 bg-background hover:bg-muted"
          }`}
          aria-label={isStarred ? "Unstar metric" : "Star as output"}
        >
          <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-current" : "text-muted-foreground"}`} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">{metric.label}</p>
            {isStarred && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                Output
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{metric.description}</p>
        </div>
      </div>
      <div className="flex flex-col items-start gap-1 text-sm sm:items-end">
        <Badge variant="outline" className="uppercase tracking-wide text-[10px]">
          {metric.metricType}
        </Badge>
        <span className="text-lg font-semibold text-foreground">
          {formatFinancialMetricValue(
            metric.value,
            metric.format,
            state.currency,
            metric.decimalPlaces
          )}
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
        {content}
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

function StarredMetricCard({
  metric,
  sectionTitle,
  onUnstar,
}: {
  metric: FinancialMetricDefinition
  sectionTitle: string
  onUnstar: () => void
}) {
  const { state } = useCalculator()
  const content = (
    <Card className="border-primary/50 bg-primary/5 border-2">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-base">{metric.label}</CardTitle>
              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                Output
              </Badge>
            </div>
            <CardDescription className="text-xs">
              {sectionTitle} • {metric.description}
            </CardDescription>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onUnstar()
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-primary bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
            aria-label="Unstar metric"
          >
            <Star className="h-4 w-4 fill-current" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline justify-between">
          <Badge variant="outline" className="uppercase tracking-wide text-[10px]">
            {metric.metricType}
          </Badge>
          <span className="text-3xl font-bold text-foreground">
            {formatFinancialMetricValue(
              metric.value,
              metric.format,
              state.currency,
              metric.decimalPlaces
            )}
          </span>
        </div>
        {metric.formula && (
          <div className="mt-4 pt-4 border-t border-border/60">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              Calculation Formula
            </p>
            <p className="text-sm font-mono text-foreground leading-relaxed">
              {metric.formula}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return content
}
