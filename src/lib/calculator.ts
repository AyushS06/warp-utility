import type {
  CalculatorMetrics,
  FinancialInputs,
  LocationMultiplier,
  RoleCostBreakdown,
  RoleInput,
  ScenarioSettings,
  SensitivityBand,
  CoreBurnMetrics,
  DetailedIncomeMetrics,
  DetailedExpenseMetrics,
} from "@/lib/types"

const EMPLOYMENT_TYPE_MULTIPLIER = {
  "full-time": 1,
  contractor: 0.8,
  "part-time": 0.5,
} as const

type EmploymentTypeKey = keyof typeof EMPLOYMENT_TYPE_MULTIPLIER

function getLocationData(
  locations: LocationMultiplier[],
  locationId: string
): LocationMultiplier | undefined {
  return locations.find((location) => location.id === locationId)
}

function calculateRoleCostBreakdown(
  role: RoleInput,
  locations: LocationMultiplier[],
  companyValuation: number
): RoleCostBreakdown {
  const locationData = getLocationData(locations, role.locationId)
  const salaryMultiplier = locationData?.salaryMultiplier ?? 1
  const benefitsMultiplier =
    role.benefitsMultiplier ?? locationData?.benefitsMultiplier ?? 0
  const employmentMultiplier =
    EMPLOYMENT_TYPE_MULTIPLIER[role.employmentType as EmploymentTypeKey] ?? 1

  const adjustedAnnualSalary =
    role.baseSalary * salaryMultiplier * employmentMultiplier
  const fullyLoadedAnnual =
    adjustedAnnualSalary * (1 + benefitsMultiplier) * role.headcount
  const monthlyFullyLoadedCost = fullyLoadedAnnual / 12

  const hasEquity =
    typeof role.equityPercentage === "number" && role.equityPercentage > 0
  const equityValue = hasEquity
    ? (role.equityPercentage / 100) * companyValuation * role.headcount
    : 0

  return {
    roleId: role.id,
    monthlyBaseCost: (adjustedAnnualSalary / 12) * role.headcount,
    monthlyFullyLoadedCost,
    annualFullyLoadedCost: fullyLoadedAnnual,
    equityValue,
  }
}

function calculateScenarioRevenue(
  financialInputs: FinancialInputs,
  scenario: ScenarioSettings
): number {
  const growthMultiplier = 1 + scenario.revenueGrowthPercent / 100
  return financialInputs.expectedMonthlyRevenue * growthMultiplier
}

function applyContingency(value: number, contingencyPercent: number) {
  return value * (1 + contingencyPercent / 100)
}

function calculateRunway(
  cashOnHand: number,
  totalMonthlyBurn: number,
  contingencyPercent: number
) {
  if (totalMonthlyBurn <= 0) {
    return Number.POSITIVE_INFINITY
  }

  const adjustedBurn = applyContingency(totalMonthlyBurn, contingencyPercent)
  return Math.max(0, cashOnHand / adjustedBurn)
}

function calculateMaxHires(
  financialInputs: FinancialInputs,
  scenario: ScenarioSettings,
  roleCosts: RoleCostBreakdown[]
) {
  const averageRoleCost =
    roleCosts.length === 0
      ? 0
      : roleCosts.reduce((sum, role) => sum + role.monthlyFullyLoadedCost, 0) /
        roleCosts.length

  if (averageRoleCost === 0) return 0

  const monthlyRevenue = calculateScenarioRevenue(financialInputs, scenario)
  const availableBudget =
    financialInputs.totalCashOnHand /
      financialInputs.targetRunwayMonths +
    monthlyRevenue -
    financialInputs.monthlyExistingBurn

  if (availableBudget <= 0) return 0

  return Math.max(0, Math.floor(availableBudget / averageRoleCost))
}

function calculateSensitivityBands(
  totalMonthlyBurn: number,
  financialInputs: FinancialInputs
): SensitivityBand[] {
  const bestCaseBurn = totalMonthlyBurn * 0.9
  const worstCaseBurn = totalMonthlyBurn * 1.1

  return [
    {
      label: "Best case",
      monthlyBurn: bestCaseBurn,
      runwayMonths: calculateRunway(
        financialInputs.totalCashOnHand,
        bestCaseBurn,
        financialInputs.contingencyBufferPercent
      ),
    },
    {
      label: "Base case",
      monthlyBurn: totalMonthlyBurn,
      runwayMonths: calculateRunway(
        financialInputs.totalCashOnHand,
        totalMonthlyBurn,
        financialInputs.contingencyBufferPercent
      ),
    },
    {
      label: "Worst case",
      monthlyBurn: worstCaseBurn,
      runwayMonths: calculateRunway(
        financialInputs.totalCashOnHand,
        worstCaseBurn,
        financialInputs.contingencyBufferPercent
      ),
    },
  ]
}

const AVERAGE_DAYS_IN_MONTH = 30.44

function calculateMonthsInPeriod(
  startDate?: string,
  endDate?: string
): number | null {
  if (!startDate || !endDate) {
    return null
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null
  }

  const diffMs = end.getTime() - start.getTime()
  if (diffMs < 0) {
    return null
  }

  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays / AVERAGE_DAYS_IN_MONTH
}

function calculateCoreBurnMetrics(
  financialInputs: FinancialInputs
): CoreBurnMetrics {
  const monthsInPeriod = calculateMonthsInPeriod(
    financialInputs.periodStartDate,
    financialInputs.periodEndDate
  )

  const averageMonthlyBurnSimple =
    monthsInPeriod && monthsInPeriod > 0
      ? (financialInputs.startingCashBalance - financialInputs.endingCashBalance) /
        monthsInPeriod
      : null

  const cashRunwaySimple =
    typeof averageMonthlyBurnSimple === "number" && averageMonthlyBurnSimple > 0
      ? financialInputs.startingCashBalance / averageMonthlyBurnSimple
      : null

  return {
    startingCashBalance: financialInputs.startingCashBalance,
    endingCashBalance: financialInputs.endingCashBalance,
    monthsInPeriod,
    averageMonthlyBurnSimple,
    cashRunwaySimple,
  }
}

function calculateIncomeMetrics(
  financialInputs: FinancialInputs
): DetailedIncomeMetrics {
  const totalMonthlyCashIncome =
    financialInputs.monthlyCashSales + financialInputs.otherMonthlyCashIncome

  return {
    monthlyCashSales: financialInputs.monthlyCashSales,
    otherMonthlyCashIncome: financialInputs.otherMonthlyCashIncome,
    totalMonthlyCashIncome,
  }
}

function calculateExpenseMetrics(
  totalMonthlyHireBurn: number,
  financialInputs: FinancialInputs
): DetailedExpenseMetrics {
  const expenses = {
    personnelExpenses: totalMonthlyHireBurn,
    rentAndUtilities: financialInputs.rentAndUtilities,
    officeSuppliesAndEquipment: financialInputs.officeSuppliesAndEquipment,
    marketingExpenses: financialInputs.marketingExpenses,
    travelExpenses: financialInputs.travelExpenses,
    otherCashExpenses: financialInputs.otherCashExpenses,
  }

  const totalMonthlyCashExpenses = Object.values(expenses).reduce(
    (sum, value) => sum + value,
    0
  )

  return {
    ...expenses,
    totalMonthlyCashExpenses,
  }
}

export function calculateMetrics({
  financialInputs,
  roles,
  locations,
  scenario,
}: {
  financialInputs: FinancialInputs
  roles: RoleInput[]
  locations: LocationMultiplier[]
  scenario: ScenarioSettings
}): CalculatorMetrics {
  const roleCosts = roles.map((role) =>
    calculateRoleCostBreakdown(role, locations, financialInputs.companyValuation)
  )

  const totalMonthlyHireBurn = roleCosts.reduce(
    (sum, role) => sum + role.monthlyFullyLoadedCost,
    0
  )

  const monthlyRevenue = calculateScenarioRevenue(financialInputs, scenario)
  const totalMonthlyBurn =
    financialInputs.monthlyExistingBurn +
    totalMonthlyHireBurn -
    monthlyRevenue

  const remainingRunway = calculateRunway(
    financialInputs.totalCashOnHand,
    totalMonthlyBurn,
    financialInputs.contingencyBufferPercent
  )

  const sensitivityBands = calculateSensitivityBands(
    totalMonthlyBurn,
    financialInputs
  )

  const maxHires = calculateMaxHires(financialInputs, scenario, roleCosts)

  const coreBurn = calculateCoreBurnMetrics(financialInputs)
  const incomeBreakdown = calculateIncomeMetrics(financialInputs)
  const expenseBreakdown = calculateExpenseMetrics(
    totalMonthlyHireBurn,
    financialInputs
  )

  return {
    totalMonthlyHireBurn,
    totalMonthlyBurn,
    fullyLoadedCostPerRole: roleCosts,
    totalAnnualHiringCost: roleCosts.reduce(
      (sum, role) => sum + role.annualFullyLoadedCost,
      0
    ),
    runwayEndsInMonth: Math.floor(remainingRunway),
    remainingRunwayMonths: remainingRunway,
    maxHiresForTargetRunway: maxHires,
    sensitivityBands,
    coreBurn,
    incomeBreakdown,
    expenseBreakdown,
  }
}

