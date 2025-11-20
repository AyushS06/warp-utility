export type EmploymentType = "full-time" | "contractor" | "part-time"

export type HiringStrategy = "staggered" | "all-at-once"

export type GrowthMode = "cash-efficient" | "growth" | "ai"

export interface FinancialInputs {
  totalCashOnHand: number
  monthlyExistingBurn: number
  expectedMonthlyRevenue: number
  targetRunwayMonths: number
  contingencyBufferPercent: number
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
  | "sales"
  | "design"
  | "product"
  | "marketing"
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
  employmentType: EmploymentType
}

export interface ScenarioSettings {
  revenueGrowthPercent: number
  hiringStrategy: HiringStrategy
  growthMode: GrowthMode
}

export interface RoleCostBreakdown {
  roleId: string
  monthlyBaseCost: number
  monthlyFullyLoadedCost: number
  annualFullyLoadedCost: number
}

export interface SensitivityBand {
  label: string
  monthlyBurn: number
  runwayMonths: number
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
}

export interface CalculatorState {
  financialInputs: FinancialInputs
  roles: RoleInput[]
  locations: LocationMultiplier[]
  scenario: ScenarioSettings
  metrics: CalculatorMetrics | null
  lastUpdatedIso?: string
}

