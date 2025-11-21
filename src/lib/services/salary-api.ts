import { ROLE_TEMPLATES } from "@/lib/role-templates"
import type { RoleCategory } from "@/lib/types"

export type SalaryBand = {
  min: number
  avg: number
  max: number
  currency: "USD"
  source: "template" | "fallback"
  confidence: "high" | "medium" | "low"
  updatedAt: string
}

export type SalaryLookupParams = {
  title: string
  locationId: string
  category?: RoleCategory
  locationMultiplier?: number
}

const BASELINE_US_SALARY = 120000
const SIMULATED_LATENCY_MS = 120
const salaryCache = new Map<string, SalaryBand>()

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function coerceMultiplier(multiplier?: number) {
  if (typeof multiplier !== "number" || Number.isNaN(multiplier)) {
    return 1
  }
  return Math.max(0.4, Math.min(multiplier, 2))
}

function fallbackBand(multiplier?: number): SalaryBand {
  const safeMultiplier = coerceMultiplier(multiplier)
  const avg = BASELINE_US_SALARY * safeMultiplier
  const min = Math.round((avg * 0.85) / 1000) * 1000
  const max = Math.round((avg * 1.15) / 1000) * 1000

  return {
    min,
    avg: Math.round(avg / 1000) * 1000,
    max,
    currency: "USD",
    source: "fallback",
    confidence: "medium",
    updatedAt: new Date().toISOString(),
  }
}

function deriveBandFromTemplate(
  title: string,
  locationId: string,
  locationMultiplier?: number,
  category?: RoleCategory
): SalaryBand | null {
  const normalized = normalize(title)
  const template =
    ROLE_TEMPLATES.find(
      (role) => normalize(role.title) === normalized || normalized.includes(normalize(role.title))
    ) ??
    (category
      ? ROLE_TEMPLATES.find((role) => role.category === category)
      : undefined)

  if (!template) {
    return null
  }

  const range = template.baseSalaryRanges.find(
    (entry) => entry.locationId === locationId
  )

  if (range) {
    return {
      min: range.min,
      avg: range.typical,
      max: range.max,
      currency: "USD",
      source: "template",
      confidence: "high",
      updatedAt: new Date().toISOString(),
    }
  }

  // Scale the typical salary using provided multiplier if a direct location match is missing
  const scaled = fallbackBand(locationMultiplier)
  return {
    ...scaled,
    source: "template",
    confidence: "medium",
  }
}

export async function fetchSalaryBand(
  params: SalaryLookupParams
): Promise<SalaryBand> {
  const cacheKey = [
    normalize(params.title),
    params.locationId,
    params.category ?? "any",
  ].join("::")

  const cached = salaryCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const band =
    deriveBandFromTemplate(
      params.title,
      params.locationId,
      params.locationMultiplier,
      params.category
    ) ?? fallbackBand(params.locationMultiplier)

  await delay(SIMULATED_LATENCY_MS)
  salaryCache.set(cacheKey, band)
  return band
}

