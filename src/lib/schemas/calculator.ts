import { z } from "zod"

const isoDateSchema = z
  .string()
  .min(1, "Date is required")
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid date",
  })

export const financialInputsSchema = z.object({
  totalCashOnHand: z.coerce.number().min(0),
  monthlyExistingBurn: z.coerce.number().min(0),
  expectedMonthlyRevenue: z.coerce.number().min(0),
  targetRunwayMonths: z.coerce.number().min(1),
  contingencyBufferPercent: z.coerce.number().min(0).max(100),
  companyValuation: z.coerce.number().min(0),
  startingCashBalance: z.coerce.number().min(0),
  endingCashBalance: z.coerce.number().min(0),
  periodStartDate: isoDateSchema,
  periodEndDate: isoDateSchema,
  monthlyCashSales: z.coerce.number().min(0),
  otherMonthlyCashIncome: z.coerce.number().min(0),
  rentAndUtilities: z.coerce.number().min(0),
  officeSuppliesAndEquipment: z.coerce.number().min(0),
  marketingExpenses: z.coerce.number().min(0),
  travelExpenses: z.coerce.number().min(0),
  otherCashExpenses: z.coerce.number().min(0),
})

export const roleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Role title is required"),
  category: z
    .enum([
      "engineering",
      "product",
      "sales",
      "marketing",
      "people",
      "talent",
      "gtm",
      "ml",
      "research",
      "design",
      "operations",
      "finance",
      "hr",
      "other",
    ])
    .optional(),
  locationId: z.string().min(1, "Location is required"),
  baseSalary: z.coerce.number().min(0, "Base salary must be positive"),
  benefitsMultiplier: z.coerce
    .number()
    .min(0, "Benefits multiplier must be positive")
    .max(1.5, "Benefits multiplier is too high"),
  hiringDate: z.string().min(1, "Hiring date is required"),
  headcount: z.coerce.number().min(1, "Headcount must be at least 1"),
  equityPercentage: z
    .coerce.number()
    .min(0, "Equity cannot be negative")
    .max(100, "Equity cannot exceed 100%")
    .optional()
    .or(z.literal("")),
  employmentType: z.enum(["full-time", "contractor", "part-time"]),
})

export const locationSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  salaryMultiplier: z.coerce.number().min(0.1),
  benefitsMultiplier: z.coerce.number().min(0).max(2),
  canEdit: z.boolean().optional(),
})

export const scenarioSchema = z.object({
  revenueGrowthPercent: z.coerce.number().min(-100).max(300),
  hiringStrategy: z.enum(["staggered", "all-at-once"]),
  growthMode: z.enum(["cash-efficient", "growth", "ai"]),
})

export const calculatorFormSchema = z.object({
  financialInputs: financialInputsSchema,
  roles: z.array(roleSchema).min(0),
  locations: z.array(locationSchema),
  scenario: scenarioSchema,
})

export type CalculatorFormValues = z.infer<typeof calculatorFormSchema>

