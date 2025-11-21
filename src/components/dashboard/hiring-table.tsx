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
import { Button } from "@/components/ui/button"
import { EditRoleSettings } from "@/components/hiring/edit-role-settings"
import { useCalculator } from "@/contexts/calculator-context"
import { getCategoryLabel } from "@/lib/role-categories"
import { Settings2 } from "lucide-react"
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency"

export function HiringOverviewTable() {
  const { state } = useCalculator()
  const roles = state.roles
  const [editingRoleId, setEditingRoleId] = React.useState<string | null>(null)
  
  const formatCurrency = React.useCallback(
    (value: number) => formatCurrencyUtil(value, state.currency),
    [state.currency]
  )
  const costLookup = Object.fromEntries(
    state.metrics?.fullyLoadedCostPerRole.map((cost) => [
      cost.roleId,
      {
        monthlyCost: cost.monthlyFullyLoadedCost,
        equityValue: cost.equityValue,
      },
    ]) ?? []
  )

  const editingRole = roles.find((role) => role.id === editingRoleId)

  if (roles.length === 0) {
    return null
  }

  return (
    <div className="border rounded-xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Headcount</TableHead>
            <TableHead>Start date</TableHead>
            <TableHead>Monthly cost</TableHead>
            <TableHead>Salary guidance</TableHead>
            <TableHead>Equity value</TableHead>
            <TableHead className="w-[100px]">Settings</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => {
            const location = state.locations.find(
              (loc) => loc.id === role.locationId
            )
            return (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.title}</TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {getCategoryLabel(role.category)}
                  </span>
                </TableCell>
                <TableCell>{location?.label ?? "—"}</TableCell>
                <TableCell className="capitalize">{role.employmentType}</TableCell>
                <TableCell>{role.headcount}</TableCell>
                <TableCell>
                  {new Date(role.hiringDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                  })}
                </TableCell>
                <TableCell>
                  {formatCurrency(costLookup[role.id ?? ""]?.monthlyCost ?? 0)}
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(role.baseSalary)}
                  </span>
                </TableCell>
                <TableCell>
                  {formatCurrency(costLookup[role.id ?? ""]?.equityValue ?? 0)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingRoleId(role.id)}
                    title="Edit role settings"
                  >
                    <Settings2 className="h-4 w-4" />
                    <span className="sr-only">Edit settings</span>
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {editingRole && (
        <EditRoleSettings
          role={editingRole}
          open={editingRoleId === editingRole.id}
          onOpenChange={(open) => {
            if (!open) {
              setEditingRoleId(null)
            }
          }}
        />
      )}
    </div>
  )
}

