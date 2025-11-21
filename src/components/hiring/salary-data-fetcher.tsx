"use client"

import * as React from "react"

import type { RoleCategory } from "@/lib/types"
import {
  fetchSalaryBand,
  type SalaryBand,
  type SalaryLookupParams,
} from "@/lib/services/salary-api"

type UseSalaryBandOptions = SalaryLookupParams & { enabled?: boolean }

export function useSalaryBand({
  title,
  locationId,
  category,
  locationMultiplier,
  enabled = true,
}: UseSalaryBandOptions) {
  const [state, setState] = React.useState<{
    band: SalaryBand | null
    loading: boolean
  }>({
    band: null,
    loading: Boolean(enabled),
  })

  React.useEffect(() => {
    if (!enabled || !title || !locationId) {
      setState((prev) => ({ ...prev, loading: false }))
      return
    }

    let cancelled = false
    setState((prev) => ({ ...prev, loading: true }))

    fetchSalaryBand({ title, locationId, category, locationMultiplier })
      .then((band) => {
        if (!cancelled) {
          setState({ band, loading: false })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ band: null, loading: false })
        }
      })

    return () => {
      cancelled = true
    }
  }, [title, locationId, category, locationMultiplier, enabled])

  return state
}

type SalaryRangeHintProps = {
  title: string
  locationId: string
  locationMultiplier?: number
  category?: RoleCategory
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100000 ? 0 : 1,
    notation: value >= 1000000 ? "compact" : "standard",
  }).format(value)
}

export function SalaryRangeHint({
  title,
  locationId,
  locationMultiplier,
  category,
}: SalaryRangeHintProps) {
  const { band, loading } = useSalaryBand({
    title,
    locationId,
    locationMultiplier,
    category,
    enabled: Boolean(title && locationId),
  })

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Loading salary data…</span>
      </div>
    )
  }

  if (!band) {
    return (
      <div className="text-sm text-muted-foreground">
        No salary data available for this role and location
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <p className="text-xs text-muted-foreground mb-1">Minimum</p>
        <p className="text-base font-semibold text-foreground">
          {formatCompactCurrency(band.min)}
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Average</p>
        <p className="text-base font-semibold text-foreground">
          {formatCompactCurrency(band.avg)}
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Maximum</p>
        <p className="text-base font-semibold text-foreground">
          {formatCompactCurrency(band.max)}
        </p>
      </div>
      <div className="col-span-3 pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Confidence: <span className="uppercase tracking-tight font-medium">{band.confidence}</span>
          {band.source === "template" && " · From Glassdoor data"}
          {band.source === "fallback" && " · Estimated"}
        </p>
      </div>
    </div>
  )
}

