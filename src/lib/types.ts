export type EmploymentType = "full-time" | "contractor" | "part-time"

export type HiringStrategy = "staggered" | "all-at-once"

export type GrowthMode = "cash-efficient" | "growth" | "ai"

export interface FinancialInputs {
  totalCashOnHand: number
  monthlyExistingBurn: number
  expectedMonthlyRevenue: number
  targetRunwayMonths: number
  contingencyBufferPercent: number
  companyValuation: number
  startingCashBalance: number
  endingCashBalance: number
  periodStartDate: string
  periodEndDate: string
  monthlyCashSales: number
  otherMonthlyCashIncome: number
  rentAndUtilities: number
  officeSuppliesAndEquipment: number
  marketingExpenses: number
  travelExpenses: number
  otherCashExpenses: number
}

export interface LocationMultiplier {
  id: string
  label: string
  salaryMultiplier: number
  benefitsMultiplier: number
  canEdit?: boolean
}

export type RoleCategory =
  | "engineering"
  | "product"
  | "sales"
  | "marketing"
  | "people"
  | "talent"
  | "gtm"
  | "ml"
  | "research"
  | "design"
  | "operations"
  | "finance"
  | "hr"
  | "other"

export interface RoleInput {
  id: string
  title: string
  category?: RoleCategory
  locationId: string
  baseSalary: number
  benefitsMultiplier: number
  hiringDate: string
  headcount: number
  equityPercentage?: number
  equityValue?: number
  employmentType: EmploymentType
  quarterPlacement?: string
  monthPlacement?: string
}

export interface ScenarioSettings {
  revenueGrowthPercent: number
  hiringStrategy: HiringStrategy
  growthMode: GrowthMode
}

export interface ScenarioSimulation {
  fundraisingTarget: number
  burnPerHire: number
  monthlyChurnRate: number
  customerAcquisitionGrowth: number
  averageRevenuePerUser: number
  customerLifetimeValue: number
  customerAcquisitionCost: number
  monthsToSimulate: number
}

export interface RoleCostBreakdown {
  roleId: string
  monthlyBaseCost: number
  monthlyFullyLoadedCost: number
  annualFullyLoadedCost: number
  equityValue: number
}

export interface SensitivityBand {
  label: string
  monthlyBurn: number
  runwayMonths: number
}

export interface CoreBurnMetrics {
  startingCashBalance: number
  endingCashBalance: number
  monthsInPeriod: number | null
  averageMonthlyBurnSimple: number | null
  cashRunwaySimple: number | null
}

export interface DetailedIncomeMetrics {
  monthlyCashSales: number
  otherMonthlyCashIncome: number
  totalMonthlyCashIncome: number
}

export interface DetailedExpenseMetrics {
  personnelExpenses: number
  rentAndUtilities: number
  officeSuppliesAndEquipment: number
  marketingExpenses: number
  travelExpenses: number
  otherCashExpenses: number
  totalMonthlyCashExpenses: number
}

export interface CalculatorMetrics {
  totalMonthlyHireBurn: number
  totalMonthlyBurn: number
  fullyLoadedCostPerRole: RoleCostBreakdown[]
  totalAnnualHiringCost: number
  runwayEndsInMonth: number
  remainingRunwayMonths: number
  maxHiresForTargetRunway: number
  sensitivityBands: SensitivityBand[]
  coreBurn: CoreBurnMetrics
  incomeBreakdown: DetailedIncomeMetrics
  expenseBreakdown: DetailedExpenseMetrics
}

export interface AIInsight {
  id: string
  type: "warning" | "info" | "success" | "critical"
  title: string
  description: string
  prediction?: {
    label: string
    value: number | string
    unit?: string
  }
  recommendation?: string
}

export interface CalculatorState {
  financialInputs: FinancialInputs
  roles: RoleInput[]
  locations: LocationMultiplier[]
  scenario: ScenarioSettings
  scenarioSimulation?: ScenarioSimulation
  metrics: CalculatorMetrics | null
  lastUpdatedIso?: string
  currency: "USD" | "GBP" | "INR" | "EUR" | "JPY" | "CAD" | "AUD"
}
