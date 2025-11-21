import type { RoleCategory } from "./types"

export const ROLE_CATEGORY_LABELS: Record<RoleCategory, string> = {
  engineering: "Engineering",
  product: "Product",
  sales: "Sales",
  marketing: "Marketing",
  people: "People",
  talent: "Talent",
  gtm: "GTM (Go-to-Market)",
  ml: "ML (Machine Learning)",
  research: "Research",
  design: "Design",
  operations: "Operations",
  finance: "Finance",
  hr: "HR",
  other: "Other",
}

export function getCategoryLabel(category?: RoleCategory): string {
  if (!category) return "Other"
  return ROLE_CATEGORY_LABELS[category] ?? "Other"
}

