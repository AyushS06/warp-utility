import { z } from "zod"

export const financialInputsSchema = z.object({
  totalCashOnHand: z.coerce.number().min(0),
  monthlyExistingBurn: z.coerce.number().min(0),
  expectedMonthlyRevenue: z.coerce.number().min(0),
  targetRunwayMonths: z.coerce.number().min(1),
  contingencyBufferPercent: z.coerce.number().min(0).max(100),
})

export const roleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Role title is required"),
  category: z
    .enum([
      "engineering",
      "sales",
      "design",
      "product",
      "marketing",
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

