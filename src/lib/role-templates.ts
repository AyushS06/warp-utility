import type { LocationMultiplier } from "./types"

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

export interface RoleTemplate {
  category: RoleCategory
  title: string
  icon: string
  baseSalaryRanges: {
    locationId: string
    min: number
    max: number
    typical: number
  }[]
  description: string
}

// Pre-populated salary ranges by role and location (realistic startup data)
export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    category: "engineering",
    title: "Software Engineer",
    icon: "💻",
    description: "Full-stack or backend engineer",
    baseSalaryRanges: [
      { locationId: "sf-nyc", min: 140000, max: 220000, typical: 180000 },
      { locationId: "austin-atlanta-remote-us", min: 110000, max: 170000, typical: 140000 },
      { locationId: "europe", min: 60000, max: 120000, typical: 90000 },
      { locationId: "india", min: 25000, max: 60000, typical: 40000 },
      { locationId: "latam", min: 30000, max: 70000, typical: 50000 },
    ],
  },
  {
    category: "engineering",
    title: "Senior Software Engineer",
    icon: "👨‍💻",
    description: "Senior full-stack or backend engineer",
    baseSalaryRanges: [
      { locationId: "sf-nyc", min: 180000, max: 280000, typical: 230000 },
      { locationId: "austin-atlanta-remote-us", min: 140000, max: 220000, typical: 180000 },
      { locationId: "europe", min: 80000, max: 150000, typical: 120000 },
      { locationId: "india", min: 40000, max: 90000, typical: 65000 },
      { locationId: "latam", min: 45000, max: 95000, typical: 70000 },
    ],
  },
  {
    category: "engineering",
    title: "Engineering Manager",
    icon: "👔",
    description: "Engineering team lead or manager",
    baseSalaryRanges: [
      { locationId: "sf-nyc", min: 200000, max: 320000, typical: 260000 },
      { locationId: "austin-atlanta-remote-us", min: 160000, max: 250000, typical: 200000 },
      { locationId: "europe", min: 90000, max: 170000, typical: 130000 },
      { locationId: "india", min: 50000, max: 110000, typical: 80000 },
      { locationId: "latam", min: 55000, max: 120000, typical: 85000 },
    ],
  },
  {
    category: "sales",
    title: "Sales Development Rep (SDR)",
    icon: "📞",
    description: "Outbound sales development",
    baseSalaryRanges: [
      { locationId: "sf-nyc", min: 60000, max: 90000, typical: 75000 },
      { locationId: "austin-atlanta-remote-us", min: 50000, max: 75000, typical: 62500 },
      { locationId: "europe", min: 35000, max: 55000, typical: 45000 },
      { locationId: "india", min: 15000, max: 30000, typical: 22500 },
      { locationId: "latam", min: 18000, max: 35000, typical: 26500 },
    ],
  },
  {
    category: "sales",
    title: "Account Executive",
    icon: "🤝",
    description: "Sales account executive",
    baseSalaryRanges: [
      { locationId: "sf-nyc", min: 100000, max: 180000, typical: 140000 },
      { locationId: "austin-atlanta-remote-us", min: 80000, max: 140000, typical: 110000 },
      { locationId: "europe", min: 50000, max: 90000, typical: 70000 },
      { locationId: "india", min: 25000, max: 55000, typical: 40000 },
      { locationId: "latam", min: 30000, max: 65000, typical: 47500 },
    ],
  },
  {
    category: "sales",
    title: "Sales Manager",
    icon: "📊",
    description: "Sales team manager",
    baseSalaryRanges: [
      { locationId: "sf-nyc", min: 140000, max: 240000, typical: 190000 },
      { locationId: "austin-atlanta-remote-us", min: 110000, max: 190000, typical: 150000 },
      { locationId: "europe", min: 70000, max: 130000, typical: 100000 },
      { locationId: "india", min: 35000, max: 75000, typical: 55000 },
      { locationId: "latam", min: 40000, max: 85000, typical: 62500 },
    ],
  },
  {
    category: "design",
    title: "Product Designer",
    icon: "🎨",
    description: "UI/UX product designer",
    baseSalaryRanges: [
      { locationId: "sf-nyc", min: 120000, max: 200000, typical: 160000 },
      { locationId: "austin-atlanta-remote-us", min: 95000, max: 160000, typical: 127500 },
      { locationId: "europe", min: 55000, max: 100000, typical: 77500 },
      { locationId: "india", min: 20000, max: 50000, typical: 35000 },
      { locationId: "latam", min: 25000, max: 60000, typical: 42500 },
    ],
  },
  {
    category: "design",
    title: "Design Lead",
    icon: "🖌️",
    description: "Senior design lead",
    baseSalaryRanges: [
      { locationId: "sf-nyc", min: 160000, max: 260000, typical: 210000 },
      { locationId: "austin-atlanta-remote-us", min: 125000, max: 205000, typical: 165000 },
      { locationId: "europe", min: 75000, max: 140000, typical: 107500 },
      { locationId: "india", min: 35000, max: 75000, typical: 55000 },
      { locationId: "latam", min: 40000, max: 85000, typical: 62500 },
    ],
  },
  {
    category: "product",
    title: "Product Manager",
    icon: "📋",
    description: "Product management",
    baseSalaryRanges: [
      { locationId: "sf-nyc", min: 140000, max: 240000, typical: 190000 },
      { locationId: "austin-atlanta-remote-us", min: 110000, max: 190000, typical: 150000 },
      { locationId: "europe", min: 70000, max: 130000, typical: 100000 },
      { locationId: "india", min: 35000, max: 75000, typical: 55000 },
      { locationId: "latam", min: 40000, max: 85000, typical: 62500 },
    ],
  },
  {
    category: "marketing",
    title: "Marketing Manager",
    icon: "📢",
    description: "Marketing and growth",
    baseSalaryRanges: [
      { locationId: "sf-nyc", min: 100000, max: 180000, typical: 140000 },
      { locationId: "austin-atlanta-remote-us", min: 80000, max: 140000, typical: 110000 },
      { locationId: "europe", min: 50000, max: 90000, typical: 70000 },
      { locationId: "india", min: 25000, max: 55000, typical: 40000 },
      { locationId: "latam", min: 30000, max: 65000, typical: 47500 },
    ],
  },
  {
    category: "operations",
    title: "Operations Manager",
    icon: "⚙️",
    description: "Operations and logistics",
    baseSalaryRanges: [
      { locationId: "sf-nyc", min: 90000, max: 160000, typical: 125000 },
      { locationId: "austin-atlanta-remote-us", min: 70000, max: 125000, typical: 97500 },
      { locationId: "europe", min: 45000, max: 80000, typical: 62500 },
      { locationId: "india", min: 20000, max: 45000, typical: 32500 },
      { locationId: "latam", min: 25000, max: 55000, typical: 40000 },
    ],
  },
  {
    category: "finance",
    title: "Finance Manager",
    icon: "💰",
    description: "Finance and accounting",
    baseSalaryRanges: [
      { locationId: "sf-nyc", min: 110000, max: 190000, typical: 150000 },
      { locationId: "austin-atlanta-remote-us", min: 85000, max: 150000, typical: 117500 },
      { locationId: "europe", min: 55000, max: 100000, typical: 77500 },
      { locationId: "india", min: 25000, max: 55000, typical: 40000 },
      { locationId: "latam", min: 30000, max: 65000, typical: 47500 },
    ],
  },
  {
    category: "hr",
    title: "People Ops / HR",
    icon: "👥",
    description: "Human resources and people operations",
    baseSalaryRanges: [
      { locationId: "sf-nyc", min: 90000, max: 160000, typical: 125000 },
      { locationId: "austin-atlanta-remote-us", min: 70000, max: 125000, typical: 97500 },
      { locationId: "europe", min: 45000, max: 80000, typical: 62500 },
      { locationId: "india", min: 20000, max: 45000, typical: 32500 },
      { locationId: "latam", min: 25000, max: 55000, typical: 40000 },
    ],
  },
]

export function getRoleTemplateByTitle(title: string): RoleTemplate | undefined {
  return ROLE_TEMPLATES.find((template) => template.title === title)
}

export function getRoleTemplatesByCategory(
  category: RoleCategory
): RoleTemplate[] {
  return ROLE_TEMPLATES.filter((template) => template.category === category)
}

export function getSalaryForRoleAndLocation(
  template: RoleTemplate,
  locationId: string
): number {
  const range = template.baseSalaryRanges.find(
    (r) => r.locationId === locationId
  )
  return range?.typical ?? 120000
}

export function getRoleIcon(category: RoleCategory): string {
  const template = ROLE_TEMPLATES.find((t) => t.category === category)
  return template?.icon ?? "👤"
}

