"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { FormattedNumberInput } from "@/components/ui/formatted-number-input"
import { Slider } from "@/components/ui/slider"
import { useCalculator } from "@/contexts/calculator-context"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Clock } from "lucide-react"
import { CountingNumber } from "@/components/ui/shadcn-io/counting-number"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { getMonthFromDate, parseMonthId } from "@/lib/months"
import type { RoleInput } from "@/lib/types"
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency"

const scenarioSimulationSchema = z.object({
  fundraisingTarget: z.coerce.number().min(0),
  burnPerHire: z.coerce.number().min(0),
  monthlyChurnRate: z.coerce.number().min(0).max(100),
  customerAcquisitionGrowth: z.coerce.number().min(-100).max(500),
  averageRevenuePerUser: z.coerce.number().min(0),
  customerLifetimeValue: z.coerce.number().min(0),
  customerAcquisitionCost: z.coerce.number().min(0),
  monthsToSimulate: z.coerce.number().min(1).max(36),
})

type ScenarioSimulationValues = z.infer<typeof scenarioSimulationSchema>

function calculateScenarioMetrics(values: ScenarioSimulationValues, currentState: any) {
  const {
    fundraisingTarget,
    burnPerHire,
    monthlyChurnRate,
    customerAcquisitionGrowth,
    averageRevenuePerUser,
    customerLifetimeValue,
    customerAcquisitionCost,
    monthsToSimulate,
  } = values

  const currentCash = currentState.financialInputs.totalCashOnHand
  const currentBurn = currentState.financialInputs.monthlyExistingBurn
  const currentRevenue = currentState.financialInputs.expectedMonthlyRevenue
  const roles = currentState.roles

  // Calculate total hiring cost
  const totalHiringCost = roles.reduce((sum: number, role: any) => {
    const location = currentState.locations.find((loc: any) => loc.id === role.locationId)
    const salaryMultiplier = location?.salaryMultiplier ?? 1
    const annualCost =
      role.baseSalary * salaryMultiplier * (1 + role.benefitsMultiplier) * role.headcount
    return sum + annualCost
  }, 0)

  const monthlyHiringCost = totalHiringCost / 12

  // New total burn with fundraising and hiring
  const newTotalBurn = currentBurn + monthlyHiringCost + burnPerHire * (roles.length || 1)
  const totalCashAfterFundraising = currentCash + fundraisingTarget

  // Calculate runway
  const runwayMonths =
    newTotalBurn > 0 ? totalCashAfterFundraising / newTotalBurn : Number.POSITIVE_INFINITY

  // Revenue projections with churn and growth
  let totalRevenue = 0
  let totalCustomers = currentRevenue > 0 && averageRevenuePerUser > 0 ? currentRevenue / averageRevenuePerUser : 0
  const monthlyGrowthRate = customerAcquisitionGrowth / 100 / 12 // Convert annual to monthly

  for (let month = 0; month < monthsToSimulate; month++) {
    // Apply churn (customers lost)
    totalCustomers = totalCustomers * (1 - monthlyChurnRate / 100)
    
    // Apply growth (new customers acquired)
    totalCustomers = totalCustomers * (1 + monthlyGrowthRate)
    
    const projectedRevenue = totalCustomers * averageRevenuePerUser
    totalRevenue += projectedRevenue
  }

  const averageMonthlyRevenue = monthsToSimulate > 0 ? totalRevenue / monthsToSimulate : 0
  const netBurn = newTotalBurn - averageMonthlyRevenue
  const adjustedRunway = netBurn > 0 ? totalCashAfterFundraising / netBurn : Number.POSITIVE_INFINITY

  // Calculate metrics
  const ltvCacRatio = customerLifetimeValue > 0 ? customerLifetimeValue / customerAcquisitionCost : 0
  const monthsToPayback = customerAcquisitionCost > 0 && averageRevenuePerUser > 0
    ? customerAcquisitionCost / averageRevenuePerUser
    : 0

  return {
    totalCashAfterFundraising,
    newTotalBurn,
    runwayMonths,
    adjustedRunway,
    averageMonthlyRevenue,
    netBurn,
    totalRevenue,
    ltvCacRatio,
    monthsToPayback,
    projectedCustomers: totalCustomers,
  }
}

export function ScenarioSimulator() {
  const { state, setScenario } = useCalculator()
  const [simulationResults, setSimulationResults] = React.useState<any>(null)
  
  const formatCurrency = React.useCallback(
    (value: number) => formatCurrencyUtil(value, state.currency),
    [state.currency]
  )
  const prevAdjustedRunwayRef = React.useRef<number | null>(null)
  const prevMonthsToPaybackRef = React.useRef<number | null>(null)
  const isInitialMountRef = React.useRef(true)
  const [delayMonths, setDelayMonths] = React.useState(3)
  const [salaryAdjustmentPercent, setSalaryAdjustmentPercent] = React.useState(-10)
  const [revenueBoostPercent, setRevenueBoostPercent] = React.useState(15)
  const [targetIncome, setTargetIncome] = React.useState(() => {
    const totalMonthlyIncome =
      state.metrics?.incomeBreakdown.totalMonthlyCashIncome ??
      state.financialInputs.monthlyCashSales +
        state.financialInputs.otherMonthlyCashIncome
    return totalMonthlyIncome
  })

  const form = useForm<ScenarioSimulationValues>({
    resolver: zodResolver(scenarioSimulationSchema),
    defaultValues: {
      fundraisingTarget: 0,
      burnPerHire: 0,
      monthlyChurnRate: 5,
      customerAcquisitionGrowth: 10,
      averageRevenuePerUser: 100,
      customerLifetimeValue: 1000,
      customerAcquisitionCost: 200,
      monthsToSimulate: 12,
    },
  })

  const fundraisingTarget = form.watch("fundraisingTarget")
  const burnPerHire = form.watch("burnPerHire")
  const monthlyChurnRate = form.watch("monthlyChurnRate")
  const customerAcquisitionGrowth = form.watch("customerAcquisitionGrowth")
  const averageRevenuePerUser = form.watch("averageRevenuePerUser")
  const customerLifetimeValue = form.watch("customerLifetimeValue")
  const customerAcquisitionCost = form.watch("customerAcquisitionCost")
  const monthsToSimulate = form.watch("monthsToSimulate")

  React.useEffect(() => {
    const values: ScenarioSimulationValues = {
      fundraisingTarget,
      burnPerHire,
      monthlyChurnRate,
      customerAcquisitionGrowth,
      averageRevenuePerUser,
      customerLifetimeValue,
      customerAcquisitionCost,
      monthsToSimulate,
    }
    const results = calculateScenarioMetrics(values, state)
    setSimulationResults(results)
    
    // Update previous values after animation starts
    if (results.adjustedRunway !== Infinity) {
      setTimeout(() => {
        prevAdjustedRunwayRef.current = results.adjustedRunway
      }, 0)
    }
    setTimeout(() => {
      prevMonthsToPaybackRef.current = results.monthsToPayback
    }, 0)
    
    isInitialMountRef.current = false
  }, [
    fundraisingTarget,
    burnPerHire,
    monthlyChurnRate,
    customerAcquisitionGrowth,
    averageRevenuePerUser,
    customerLifetimeValue,
    customerAcquisitionCost,
    monthsToSimulate,
    state,
  ])

  // Automatically update scenario when customerAcquisitionGrowth changes
  React.useEffect(() => {
    setScenario({
      revenueGrowthPercent: customerAcquisitionGrowth,
    })
  }, [customerAcquisitionGrowth, setScenario])

  const metrics = state.metrics
  const personnelBurn = metrics?.expenseBreakdown.personnelExpenses ?? 0
  const totalMonthlyExpenses = metrics?.expenseBreakdown.totalMonthlyCashExpenses ?? 0
  const totalMonthlyIncome = metrics?.incomeBreakdown.totalMonthlyCashIncome ?? 0
  const monthlyExistingBurn = state.financialInputs.monthlyExistingBurn
  const totalCashOnHand = state.financialInputs.totalCashOnHand
  const totalHeadcount = state.roles.reduce((sum, role) => sum + role.headcount, 0)
  const avgMonthlyCostPerHead = totalHeadcount > 0 ? personnelBurn / totalHeadcount : 0
  const nonPersonnelExpenses = Math.max(0, totalMonthlyExpenses - personnelBurn)
  const monthlyBurnDetailed = totalMonthlyExpenses - totalMonthlyIncome
  const computeDetailedRunway = React.useCallback(
    (burn: number) => {
      if (burn <= 0) {
        return Number.POSITIVE_INFINITY
      }
      return Math.max(0, totalCashOnHand / burn)
    },
    [totalCashOnHand]
  )
  const baseRunway = computeDetailedRunway(monthlyBurnDetailed)

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

  const roleCostLookup = React.useMemo(() => {
    if (!metrics?.fullyLoadedCostPerRole) return {}
    return Object.fromEntries(
      metrics.fullyLoadedCostPerRole.map((cost) => [cost.roleId, cost.monthlyFullyLoadedCost])
    )
  }, [metrics?.fullyLoadedCostPerRole])

  const currentPersonnelBurn = React.useMemo(() => {
    const today = getMonthFromDate(new Date())
    return state.roles.reduce((sum, role) => {
      const descriptor = getRoleMonthDescriptor(role)
      if (
        descriptor &&
        (descriptor.year < today.year ||
          (descriptor.year === today.year && descriptor.month <= today.month))
      ) {
        const cost = roleCostLookup[role.id] ?? 0
        return sum + cost
      }
      return sum
    }, 0)
  }, [state.roles, getRoleMonthDescriptor, roleCostLookup])

  const futurePersonnelBurn = Math.max(0, personnelBurn - currentPersonnelBurn)

  const burnWithoutFutureHires = Math.max(
    0,
    nonPersonnelExpenses + currentPersonnelBurn - totalMonthlyIncome
  )

  const delayCashSaved = Math.max(0, futurePersonnelBurn * delayMonths)

  const calculateRunwayDelta = React.useCallback(
    (scenarioRunway: number) => {
      const base = baseRunway
      if (!Number.isFinite(scenarioRunway) && !Number.isFinite(base)) {
        return 0
      }
      if (!Number.isFinite(scenarioRunway) && Number.isFinite(base)) {
        return Number.POSITIVE_INFINITY
      }
      if (Number.isFinite(scenarioRunway) && !Number.isFinite(base)) {
        return Number.NEGATIVE_INFINITY
      }
      return scenarioRunway - base
    },
    [baseRunway]
  )

  const formatRunwayDelta = (delta: number) => {
    if (delta === Number.POSITIVE_INFINITY) return "+∞ mo"
    if (delta === Number.NEGATIVE_INFINITY) return "−∞ mo"
    if (!Number.isFinite(delta) || Math.abs(delta) < 0.05) {
      return "No change"
    }
    const sign = delta > 0 ? "+" : "−"
    return `${sign}${Math.abs(delta).toFixed(1)} mo`
  }

  const delayRunway = React.useMemo(() => {
    if (delayMonths <= 0) return baseRunway
    if (burnWithoutFutureHires <= 0) {
      return Number.POSITIVE_INFINITY
    }
    const burnDuringDelay = burnWithoutFutureHires
    const cashAfterDelay = totalCashOnHand - burnDuringDelay * delayMonths
    if (cashAfterDelay <= 0) {
      return Math.max(0, totalCashOnHand / burnWithoutFutureHires)
    }
    if (monthlyBurnDetailed <= 0) {
      return Number.POSITIVE_INFINITY
    }
    return delayMonths + cashAfterDelay / monthlyBurnDetailed
  }, [
    delayMonths,
    baseRunway,
    burnWithoutFutureHires,
    totalCashOnHand,
    monthlyBurnDetailed,
  ])

  const adjustedPersonnelBurn = personnelBurn * (1 + salaryAdjustmentPercent / 100)
  const tmceSalaryScenario = nonPersonnelExpenses + adjustedPersonnelBurn
  const salaryScenarioBurn = tmceSalaryScenario - totalMonthlyIncome
  const salaryAdjustedRunway = computeDetailedRunway(salaryScenarioBurn)
  const salaryBurnDelta = adjustedPersonnelBurn - personnelBurn

  const revenueBoostAmount = totalMonthlyIncome * (revenueBoostPercent / 100)
  const revenueBoostScenarioBurn = totalMonthlyExpenses - (totalMonthlyIncome + revenueBoostAmount)
  const revenueBoostRunway = computeDetailedRunway(revenueBoostScenarioBurn)
  const delayRunwayDelta = calculateRunwayDelta(delayRunway)
  const salaryRunwayDelta = calculateRunwayDelta(salaryAdjustedRunway)
  const revenueRunwayDelta = calculateRunwayDelta(revenueBoostRunway)

  const maxPersonnelBudget = Math.max(0, targetIncome - nonPersonnelExpenses)
  const breakEvenHeadcount =
    avgMonthlyCostPerHead > 0
      ? Math.max(0, Math.floor(maxPersonnelBudget / avgMonthlyCostPerHead))
      : 0
  const breakEvenPersonnelSpend = breakEvenHeadcount * avgMonthlyCostPerHead

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scenario Simulation</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fundraisingTarget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fundraising target</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FormattedNumberInput
                            value={field.value}
                            onChange={(value) => field.onChange(value ?? 0)}
                            min={0}
                            className="pr-12"
                          />
                          <span className="text-muted-foreground absolute inset-y-0 right-3 flex items-center text-sm">
                            USD
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Additional capital to raise
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="burnPerHire"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional burn per hire</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FormattedNumberInput
                            value={field.value}
                            onChange={(value) => field.onChange(value ?? 0)}
                            min={0}
                            className="pr-12"
                          />
                          <span className="text-muted-foreground absolute inset-y-0 right-3 flex items-center text-sm">
                            USD/mo
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Extra monthly burn per new hire (tools, equipment, etc.)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="monthlyChurnRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Monthly churn rate ({field.value}%)
                      </FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={20}
                          step={0.5}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Percentage of customers lost per month
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerAcquisitionGrowth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Customer acquisition growth ({field.value}% annually)
                      </FormLabel>
                      <FormControl>
                        <Slider
                          min={-50}
                          max={500}
                          step={5}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Annual growth rate for new customer acquisition
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="averageRevenuePerUser"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Average revenue per user (ARPU)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FormattedNumberInput
                            value={field.value}
                            onChange={(value) => field.onChange(value ?? 0)}
                            min={0}
                            className="pr-12"
                          />
                          <span className="text-muted-foreground absolute inset-y-0 right-3 flex items-center text-sm">
                            USD/mo
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerLifetimeValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer lifetime value (LTV)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FormattedNumberInput
                            value={field.value}
                            onChange={(value) => field.onChange(value ?? 0)}
                            min={0}
                            className="pr-12"
                          />
                          <span className="text-muted-foreground absolute inset-y-0 right-3 flex items-center text-sm">
                            USD
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerAcquisitionCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer acquisition cost (CAC)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FormattedNumberInput
                            value={field.value}
                            onChange={(value) => field.onChange(value ?? 0)}
                            min={0}
                            className="pr-12"
                          />
                          <span className="text-muted-foreground absolute inset-y-0 right-3 flex items-center text-sm">
                            USD
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="monthsToSimulate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Simulation period ({field.value} months)</FormLabel>
                    <FormControl>
                      <Slider
                        min={6}
                        max={36}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of months to project forward
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      {simulationResults && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total cash
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {formatCurrency(simulationResults.totalCashAfterFundraising)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                After fundraising
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Monthly burn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {formatCurrency(simulationResults.newTotalBurn)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                With hiring plan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Projected runway
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {simulationResults.adjustedRunway === Infinity ? (
                  "∞"
                ) : (
                  <>
                    <CountingNumber
                      number={simulationResults.adjustedRunway}
                      fromNumber={
                        isInitialMountRef.current
                          ? 0
                          : prevAdjustedRunwayRef.current ?? simulationResults.adjustedRunway
                      }
                      decimalPlaces={1}
                    />
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      months
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                With revenue projections
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Avg monthly revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {formatCurrency(simulationResults.averageMonthlyRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Over {monthsToSimulate} months
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                LTV:CAC ratio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {simulationResults.ltvCacRatio.toFixed(2)}:1
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {simulationResults.ltvCacRatio >= 3 ? (
                  <Badge variant="default" className="text-xs">Healthy</Badge>
                ) : simulationResults.ltvCacRatio >= 1 ? (
                  <Badge variant="secondary" className="text-xs">Marginal</Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">Poor</Badge>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                CAC payback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                <CountingNumber
                  number={simulationResults.monthsToPayback}
                  fromNumber={
                    isInitialMountRef.current
                      ? 0
                      : prevMonthsToPaybackRef.current ?? simulationResults.monthsToPayback
                  }
                  decimalPlaces={1}
                />
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  months
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Time to recover CAC
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {metrics && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>High-ROI scenario ideas</CardTitle>
            <CardDescription>
              Quick sliders that stress-test hiring, salary, revenue, and headcount goals using your existing metrics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-4">
              <AccordionItem value="delay-hiring" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="text-left">
                      <p className="text-base font-semibold">Delay hiring impact</p>
                      <p className="text-sm text-muted-foreground">
                        Delay future hires to see how much cash and runway you preserve.
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <FormulaTooltipCard formula="Delay Hiring: PE_Scenario = Current Personnel Expenses (no new hires) for the delay window. TMCE_Scenario = PE_Scenario + Non-Personnel Expenses. MBR_Scenario = TMCE_Scenario − TMCI. CRD_Scenario = Cash ÷ MBR_Scenario. Output = CRD_Scenario − CRD_Original.">
                    <div className="space-y-4 pt-2">
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Delay period</span>
                    <span>{delayMonths} mo</span>
                  </div>
                  <Slider
                    min={0}
                    max={12}
                    step={1}
                    value={[delayMonths]}
                    onValueChange={(value) => setDelayMonths(value[0])}
                  />
                </div>
                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Cash preserved</span>
                          <span className="font-semibold">
                            {formatCurrency(Math.round(delayCashSaved))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Burn during delay</span>
                          <span className="font-semibold">
                            {formatCurrency(Math.round(burnWithoutFutureHires))}
                            <span className="text-xs text-muted-foreground ml-1">
                              /mo
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Runway after delay
                          </span>
                          <span className="font-semibold">
                            {delayRunway === Infinity
                              ? "∞"
                              : `${delayRunway.toFixed(1)} mo`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Runway change</span>
                          <span className="font-semibold">
                            {formatRunwayDelta(delayRunwayDelta)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </FormulaTooltipCard>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="salary-adjustment" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="text-left">
                      <p className="text-base font-semibold">Salary adjustment impact</p>
                      <p className="text-sm text-muted-foreground">
                        Model +/- changes to average salary for planned hires.
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <FormulaTooltipCard formula="Salary Adjustment: PE_Scenario = PE_Original × (1 + Δ%). TMCE_Scenario = PE_Scenario + Non-Personnel Expenses. MBR_Scenario = TMCE_Scenario − TMCI. CRD_Scenario = Cash ÷ MBR_Scenario. Output = CRD_Scenario − CRD_Original.">
                    <div className="space-y-4 pt-2">
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Adjustment</span>
                    <span>{salaryAdjustmentPercent}%</span>
                  </div>
                  <Slider
                    min={-20}
                    max={20}
                    step={1}
                    value={[salaryAdjustmentPercent]}
                    onValueChange={(value) =>
                      setSalaryAdjustmentPercent(value[0])
                    }
                  />
                </div>
                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Personnel spend
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(Math.round(adjustedPersonnelBurn))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Monthly burn change
                          </span>
                          <span
                            className={cn(
                              "font-semibold",
                              salaryBurnDelta > 0
                                ? "text-destructive"
                                : salaryBurnDelta < 0
                                ? "text-emerald-600 dark:text-emerald-500"
                                : undefined
                            )}
                          >
                            {salaryBurnDelta === 0
                              ? "No change"
                              : `${salaryBurnDelta > 0 ? "+" : "-"}${formatCurrency(
                                  Math.abs(Math.round(salaryBurnDelta))
                                )}/mo`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Runway with change
                          </span>
                          <span className="font-semibold">
                            {salaryAdjustedRunway === Infinity
                              ? "∞"
                              : `${salaryAdjustedRunway.toFixed(1)} mo`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Runway change</span>
                          <span className="font-semibold">
                            {formatRunwayDelta(salaryRunwayDelta)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </FormulaTooltipCard>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="revenue-boost" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="text-left">
                      <p className="text-base font-semibold">Revenue boost scenario</p>
                      <p className="text-sm text-muted-foreground">
                        Increase monthly cash sales to see burn relief and runway gain.
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <FormulaTooltipCard formula="Revenue Boost: TMCI_Scenario = TMCI_Original × (1 + Δ%). MBR_Scenario = TMCE − TMCI_Scenario. CRD_Scenario = Cash ÷ MBR_Scenario. Output = CRD_Scenario − CRD_Original.">
                    <div className="space-y-4 pt-2">
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Sales lift</span>
                    <span>{revenueBoostPercent}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={50}
                    step={1}
                    value={[revenueBoostPercent]}
                    onValueChange={(value) => setRevenueBoostPercent(value[0])}
                  />
                </div>
                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Added revenue
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(Math.round(revenueBoostAmount))}
                            <span className="text-xs text-muted-foreground ml-1">
                              /mo
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">New burn rate</span>
                          <span className="font-semibold">
                            {formatCurrency(Math.round(revenueBoostScenarioBurn))}
                            <span className="text-xs text-muted-foreground ml-1">
                              /mo
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Runway after boost
                          </span>
                          <span className="font-semibold">
                            {revenueBoostRunway === Infinity
                              ? "∞"
                              : `${revenueBoostRunway.toFixed(1)} mo`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Runway change
                          </span>
                          <span className="font-semibold">
                            {formatRunwayDelta(revenueRunwayDelta)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </FormulaTooltipCard>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="break-even" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="text-left">
                      <p className="text-base font-semibold">Break-even headcount</p>
                      <p className="text-sm text-muted-foreground">
                        Set a target monthly income to see how many hires fit at zero burn.
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <FormulaTooltipCard formula="Break-Even Goal Seek: Set MBR_Target = 0, so TMCE_Required = TMCI_Projected. PE_Max = TMCE_Required − Non-Personnel Expenses.">
                    <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Target total monthly cash income
                  </p>
                  <FormattedNumberInput
                    value={targetIncome}
                    onChange={(value) => setTargetIncome(value ?? 0)}
                    min={0}
                  />
                </div>
                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Max personnel budget
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(Math.round(maxPersonnelBudget))}
                            <span className="text-xs text-muted-foreground ml-1">
                              /mo
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Avg cost / hire</span>
                          <span className="font-semibold">
                            {avgMonthlyCostPerHead > 0
                              ? `${formatCurrency(
                                  Math.round(avgMonthlyCostPerHead)
                                )}/mo`
                              : "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Sustainable headcount
                          </span>
                          <span className="font-semibold">
                            {breakEvenHeadcount} people
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Personnel spend at goal
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(Math.round(breakEvenPersonnelSpend))}
                            <span className="text-xs text-muted-foreground ml-1">
                              /mo
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </FormulaTooltipCard>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function FormulaTooltipCard({
  formula,
  children,
}: {
  formula?: string
  children: React.ReactNode
}) {
  if (!formula) {
    return <>{children}</>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
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
            {formula}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

