"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Settings2, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormattedNumberInput } from "@/components/ui/formatted-number-input"
import { useCalculator } from "@/contexts/calculator-context"
import type { RoleInput } from "@/lib/types"
import { SalaryRangeHint } from "@/components/hiring/salary-data-fetcher"

const editRoleSettingsSchema = z.object({
  locationId: z.string().min(1, "Location is required"),
  baseSalary: z.coerce.number().min(0, "Base salary must be positive"),
  benefitsMultiplier: z.coerce.number().min(0).max(1.5),
})

type EditRoleSettingsValues = z.infer<typeof editRoleSettingsSchema>

type EditRoleSettingsProps = {
  role: RoleInput
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditRoleSettings({
  role,
  open,
  onOpenChange,
}: EditRoleSettingsProps) {
  const { state, updateRole, removeRole } = useCalculator()
  const locations = state.locations
  const roleLocation = locations.find((loc) => loc.id === role.locationId)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)

  const form = useForm<EditRoleSettingsValues>({
    resolver: zodResolver(editRoleSettingsSchema),
    defaultValues: {
      locationId: role.locationId,
      baseSalary: role.baseSalary,
      benefitsMultiplier: role.benefitsMultiplier,
    },
  })

  React.useEffect(() => {
    if (open && role) {
      form.reset({
        locationId: role.locationId,
        baseSalary: role.baseSalary,
        benefitsMultiplier: role.benefitsMultiplier,
      })
    }
  }, [open, role, form])

  const selectedLocationId = form.watch("locationId")
  const selectedLocation = locations.find((loc) => loc.id === selectedLocationId)

  // Update benefits multiplier when location changes
  React.useEffect(() => {
    if (selectedLocation && open) {
      form.setValue("benefitsMultiplier", selectedLocation.benefitsMultiplier)
    }
  }, [selectedLocation, form, open])

  const handleSubmit = (values: EditRoleSettingsValues) => {
    updateRole(role.id, {
      locationId: values.locationId,
      baseSalary: values.baseSalary,
      benefitsMultiplier: values.benefitsMultiplier,
    })
    onOpenChange(false)
  }

  const handleClose = () => {
    form.reset()
    setShowDeleteConfirm(false)
    onOpenChange(false)
  }

  const handleDelete = () => {
    removeRole(role.id)
    handleClose()
  }

  return (
    <>
      <Dialog open={open && !showDeleteConfirm} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit role settings</DialogTitle>
            <DialogDescription>
              Configure location, salary, and benefits for {role.title}. These settings affect the total cost calculation.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.label}
                          <span className="text-muted-foreground ml-2">
                            ({location.salaryMultiplier}x multiplier)
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Location affects salary multiplier and benefits
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedLocation && (
              <div className="p-4 bg-muted rounded-lg border border-border">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">
                      Salary Range for {selectedLocation.label}
                    </h4>
                  </div>
                  <SalaryRangeHint
                    title={role.title}
                    locationId={selectedLocation.id}
                    locationMultiplier={selectedLocation.salaryMultiplier}
                    category={role.category}
                  />
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="baseSalary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base salary (annual)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FormattedNumberInput
                        value={field.value}
                        onChange={(value) => field.onChange(value ?? 0)}
                        min={0}
                        className="pr-12"
                      />
                      <span className="text-muted-foreground absolute inset-y-0 right-3 flex items-center text-sm">
                        USD
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Annual base salary before location multiplier
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="benefitsMultiplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Benefits multiplier</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FormattedNumberInput
                        value={field.value}
                        onChange={(value) => field.onChange(value ?? 0)}
                        min={0}
                        max={1.5}
                        allowDecimals
                        className="pr-12"
                      />
                      <span className="text-muted-foreground absolute inset-y-0 right-3 flex items-center text-sm">
                        %
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Benefits and taxes as % of base salary. Defaults to location's standard rate.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedLocation && (
              <div className="p-3 bg-muted rounded-md text-sm">
                <p className="font-medium mb-1">Cost calculation:</p>
                <p className="text-muted-foreground">
                  Base: ${form.watch("baseSalary").toLocaleString()} × {selectedLocation.salaryMultiplier}x (location) × {(1 + form.watch("benefitsMultiplier")).toFixed(2)}x (with benefits) ={" "}
                  <span className="font-semibold text-foreground">
                    ${(
                      form.watch("baseSalary") *
                      selectedLocation.salaryMultiplier *
                      (1 + form.watch("benefitsMultiplier"))
                    ).toLocaleString()}{" "}
                    / year
                  </span>
                </p>
              </div>
            )}

            <DialogFooter className="flex items-center justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="mr-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove role
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Save settings
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove role from hiring plan?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{role.title}</strong> from your hiring plan? This action cannot be undone and will update all metrics accordingly.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

