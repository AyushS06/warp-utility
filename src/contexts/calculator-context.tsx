"use client"

import * as React from "react"

import { calculateMetrics } from "@/lib/calculator"
import { DEFAULT_LOCATIONS } from "@/lib/locations"
import type {
  CalculatorMetrics,
  CalculatorState,
  FinancialInputs,
  LocationMultiplier,
  RoleInput,
  ScenarioSettings,
} from "@/lib/types"

const STORAGE_KEY = "headcount-calculator-state-v1"

type PersistedCalculatorState = Omit<CalculatorState, "metrics" | "lastUpdatedIso">

const DEFAULT_FINANCIAL_INPUTS: FinancialInputs = {
  totalCashOnHand: 500000,
  monthlyExistingBurn: 30000,
  expectedMonthlyRevenue: 50000,
  targetRunwayMonths: 18,
  contingencyBufferPercent: 15,
}

const RESET_FINANCIAL_INPUTS: FinancialInputs = {
  totalCashOnHand: 0,
  monthlyExistingBurn: 0,
  expectedMonthlyRevenue: 0,
  targetRunwayMonths: 18,
  contingencyBufferPercent: 15,
}

const DEFAULT_SCENARIO: ScenarioSettings = {
  revenueGrowthPercent: 0,
  hiringStrategy: "staggered",
  growthMode: "cash-efficient",
}

const defaultLocations: LocationMultiplier[] = DEFAULT_LOCATIONS.map(
  (location) => ({ ...location })
)

function withMetrics(
  state: PersistedCalculatorState,
  skipTimestamp = false
): CalculatorState {
  const metrics: CalculatorMetrics = calculateMetrics({
    financialInputs: state.financialInputs,
    roles: state.roles,
    locations: state.locations,
    scenario: state.scenario,
  })

  return {
    ...state,
    metrics,
    lastUpdatedIso: skipTimestamp ? undefined : new Date().toISOString(),
  }
}

const defaultState = withMetrics({
  financialInputs: DEFAULT_FINANCIAL_INPUTS,
  roles: [],
  locations: defaultLocations,
  scenario: DEFAULT_SCENARIO,
}, true)

function loadStateFromStorage(): PersistedCalculatorState | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored) as PersistedCalculatorState
    if (!parsed.financialInputs || !parsed.locations || !parsed.scenario) {
      return null
    }
    return parsed
  } catch (error) {
    console.error("Failed to parse calculator state", error)
    return null
  }
}

function persistState(state: CalculatorState) {
  if (typeof window === "undefined") {
    return
  }

  const payload: PersistedCalculatorState = {
    financialInputs: state.financialInputs,
    locations: state.locations,
    roles: state.roles,
    scenario: state.scenario,
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

type CalculatorContextValue = {
  state: CalculatorState
  plannerOpen: boolean
  setFinancialInputs: (inputs: Partial<FinancialInputs>) => void
  addRole: (role: Omit<RoleInput, "id"> & { id?: string }) => void
  updateRole: (roleId: string, updates: Partial<RoleInput>) => void
  removeRole: (roleId: string) => void
  setRoles: (roles: RoleInput[]) => void
  setScenario: (scenario: Partial<ScenarioSettings>) => void
  addLocation: (location: LocationMultiplier) => void
  updateLocation: (
    locationId: string,
    updates: Partial<LocationMultiplier>
  ) => void
  setLocations: (locations: LocationMultiplier[]) => void
  resetCalculator: () => void
  setPlannerOpen: (open: boolean) => void
}

const CalculatorContext =
  React.createContext<CalculatorContextValue | null>(null)

export function CalculatorProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<CalculatorState>(defaultState)
  const [plannerOpen, setPlannerOpen] = React.useState(false)
  const hasHydrated = React.useRef(false)

  React.useEffect(() => {
    const storedState = loadStateFromStorage()
    if (storedState) {
      setState(withMetrics(storedState))
    }
    hasHydrated.current = true
  }, [])

  React.useEffect(() => {
    if (hasHydrated.current) {
      persistState(state)
    }
  }, [state])

  const updateState = React.useCallback(
    (updater: (state: PersistedCalculatorState) => PersistedCalculatorState) => {
      setState((prev) => withMetrics(updater(prev)))
    },
    []
  )

  const setFinancialInputs = React.useCallback(
    (inputs: Partial<FinancialInputs>) => {
      updateState((prev) => ({
        ...prev,
        financialInputs: { ...prev.financialInputs, ...inputs },
      }))
    },
    [updateState]
  )

  const addRole = React.useCallback(
    (role: Omit<RoleInput, "id"> & { id?: string }) => {
      updateState((prev) => ({
        ...prev,
        roles: [
          ...prev.roles,
          { ...role, id: role.id ?? crypto.randomUUID() },
        ],
      }))
    },
    [updateState]
  )

  const updateRole = React.useCallback(
    (roleId: string, updates: Partial<RoleInput>) => {
      updateState((prev) => ({
        ...prev,
        roles: prev.roles.map((role) =>
          role.id === roleId ? { ...role, ...updates } : role
        ),
      }))
    },
    [updateState]
  )

  const removeRole = React.useCallback(
    (roleId: string) => {
      updateState((prev) => ({
        ...prev,
        roles: prev.roles.filter((role) => role.id !== roleId),
      }))
    },
    [updateState]
  )

  const setScenario = React.useCallback(
    (scenario: Partial<ScenarioSettings>) => {
      updateState((prev) => ({
        ...prev,
        scenario: { ...prev.scenario, ...scenario },
      }))
    },
    [updateState]
  )

  const addLocation = React.useCallback(
    (location: LocationMultiplier) => {
      updateState((prev) => ({
        ...prev,
        locations: [...prev.locations, location],
      }))
    },
    [updateState]
  )

  const updateLocation = React.useCallback(
    (locationId: string, updates: Partial<LocationMultiplier>) => {
      updateState((prev) => ({
        ...prev,
        locations: prev.locations.map((location) =>
          location.id === locationId ? { ...location, ...updates } : location
        ),
      }))
    },
    [updateState]
  )

  const setRoles = React.useCallback(
    (roles: RoleInput[]) => {
      updateState((prev) => ({
        ...prev,
        roles,
      }))
    },
    [updateState]
  )

  const setLocations = React.useCallback(
    (locations: LocationMultiplier[]) => {
      updateState((prev) => ({
        ...prev,
        locations,
      }))
    },
    [updateState]
  )

  const resetCalculator = React.useCallback(() => {
    const resetLocations: LocationMultiplier[] = DEFAULT_LOCATIONS.map(
      (location) => ({ ...location })
    )
    const resetState = withMetrics({
      financialInputs: RESET_FINANCIAL_INPUTS,
      roles: [],
      locations: resetLocations,
      scenario: DEFAULT_SCENARIO,
    })
    setState(resetState)
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const value = React.useMemo<CalculatorContextValue>(
    () => ({
      state,
      plannerOpen,
      setFinancialInputs,
      addRole,
      updateRole,
      removeRole,
      setRoles,
      setScenario,
      addLocation,
      updateLocation,
      setLocations,
      resetCalculator,
      setPlannerOpen,
    }),
    [
      state,
      plannerOpen,
      setFinancialInputs,
      addRole,
      updateRole,
      removeRole,
      setRoles,
      setScenario,
      addLocation,
      updateLocation,
      setLocations,
      resetCalculator,
      setPlannerOpen,
    ]
  )

  return (
    <CalculatorContext.Provider value={value}>
      {children}
    </CalculatorContext.Provider>
  )
}

export function useCalculator() {
  const context = React.useContext(CalculatorContext)
  if (!context) {
    throw new Error("useCalculator must be used within a CalculatorProvider")
  }
  return context
}

