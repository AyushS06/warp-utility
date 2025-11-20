"use client"

import * as React from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCalculator } from "@/contexts/calculator-context"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

export function HiringOverviewTable() {
  const { state } = useCalculator()
  const roles = state.roles
  const costLookup = Object.fromEntries(
    state.metrics?.fullyLoadedCostPerRole.map((cost) => [
      cost.roleId,
      cost.monthlyFullyLoadedCost,
    ]) ?? []
  )

  if (roles.length === 0) {
    return null
  }

  return (
    <div className="border rounded-xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Headcount</TableHead>
            <TableHead>Start date</TableHead>
            <TableHead>Monthly cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell>{role.title}</TableCell>
              <TableCell>
                {
                  state.locations.find((location) => location.id === role.locationId)
                    ?.label
                }
              </TableCell>
              <TableCell className="capitalize">{role.employmentType}</TableCell>
              <TableCell>{role.headcount}</TableCell>
              <TableCell>
                {new Date(role.hiringDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                })}
              </TableCell>
              <TableCell>
                {formatCurrency(costLookup[role.id ?? ""] ?? 0)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

