import type { LocationMultiplier } from "@/lib/types"

export const DEFAULT_LOCATIONS: LocationMultiplier[] = [
  {
    id: "sf-nyc",
    label: "San Francisco / NYC",
    salaryMultiplier: 1.4,
    benefitsMultiplier: 0.38,
  },
  {
    id: "austin-atlanta-remote-us",
    label: "Austin / Atlanta / Remote US",
    salaryMultiplier: 1.1,
    benefitsMultiplier: 0.32,
  },
  {
    id: "europe",
    label: "Europe",
    salaryMultiplier: 0.85,
    benefitsMultiplier: 0.28,
  },
  {
    id: "india",
    label: "India",
    salaryMultiplier: 0.65,
    benefitsMultiplier: 0.22,
  },
  {
    id: "latam",
    label: "LATAM",
    salaryMultiplier: 0.75,
    benefitsMultiplier: 0.25,
  },
] satisfies LocationMultiplier[]

export function createCustomLocation(
  label: string,
  salaryMultiplier: number,
  benefitsMultiplier: number
): LocationMultiplier {
  return {
    id: `custom-${crypto.randomUUID()}`,
    label,
    salaryMultiplier,
    benefitsMultiplier,
    canEdit: true,
  }
}

export function findLocationMultiplier(
  locations: LocationMultiplier[],
  locationId: string
): LocationMultiplier | undefined {
  return locations.find((loc) => loc.id === locationId)
}

