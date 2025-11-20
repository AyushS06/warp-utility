"use client"

import * as React from "react"
import { useFieldArray, type UseFormReturn } from "react-hook-form"
import { Table2, Calendar } from "lucide-react"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HiringPlanTable } from "./hiring-plan-table"
import { TimelineView } from "./timeline-view"
import { RolePicker } from "./role-picker"
import type { CalculatorFormValues } from "@/lib/schemas/calculator"
import type { RoleInput } from "@/lib/types"

type HiringPlanSectionProps = {
  form: UseFormReturn<CalculatorFormValues>
}

export function HiringPlanSection({ form }: HiringPlanSectionProps) {
  const { control, watch } = form
  const locations = watch("locations")
  const roles = watch("roles")
  const [rolePickerOpen, setRolePickerOpen] = React.useState(false)

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "roles",
  })

  const handleRolesChange = React.useCallback(
    (newRoles: typeof roles) => {
      // Preserve IDs from existing roles where possible
      const rolesWithIds: RoleInput[] = newRoles.map((role) => {
        // Try to find existing role by ID first
        const existingRole = roles.find((r) => r.id === role.id)
        if (existingRole) {
          return { ...role, id: existingRole.id } as RoleInput
        }
        // If no match, generate new ID
        return {
          ...role,
          id: role.id ?? crypto.randomUUID(),
        } as RoleInput
      })
      replace(rolesWithIds)
    },
    [replace, roles]
  )

  const handleSelectRole = React.useCallback(
    (roleTemplate: Omit<typeof roles[0], "id">) => {
      append({
        ...roleTemplate,
        id: crypto.randomUUID(),
      })
    },
    [append]
  )

  return (
    <div className="space-y-4 w-full">
      <Tabs defaultValue="table" className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="table">
              <Table2 className="mr-2 h-4 w-4" />
              Table
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Calendar className="mr-2 h-4 w-4" />
              Timeline
            </TabsTrigger>
          </TabsList>
          <Button
            type="button"
            variant="outline"
            onClick={() => setRolePickerOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add role from template
          </Button>
        </div>

        <TabsContent value="table" className="mt-4 w-full">
          <HiringPlanTable form={form} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4 w-full">
          <TimelineView
            roles={roles}
            onRolesChange={handleRolesChange}
            locations={locations.map((loc) => ({ id: loc.id, label: loc.label }))}
          />
        </TabsContent>
      </Tabs>

      <RolePicker
        open={rolePickerOpen}
        onOpenChange={setRolePickerOpen}
        onSelect={handleSelectRole}
        defaultLocationId={locations[0]?.id ?? ""}
      />
    </div>
  )
}

