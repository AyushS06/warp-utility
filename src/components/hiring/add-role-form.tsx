"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { useCalculator } from "@/contexts/calculator-context"
import type { RoleCategory, RoleInput } from "@/lib/types"
import { getSalaryForRoleAndLocation, ROLE_TEMPLATES } from "@/lib/role-templates"
import { ROLE_CATEGORY_LABELS } from "@/lib/role-categories"
import { getMonthIdFromDate } from "@/lib/months"
import { SalaryRangeHint } from "./salary-data-fetcher"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const roleCategorySchema = z.enum([
  "engineering",
  "product",
  "sales",
  "marketing",
  "people",
  "talent",
  "gtm",
  "ml",
  "research",
  "design",
  "operations",
  "finance",
  "hr",
  "other",
])

const addRoleFormSchema = z.object({
  category: roleCategorySchema,
  title: z.string().min(1, "Role title is required"),
  locationId: z.string().min(1, "Location is required"),
  baseSalary: z.coerce.number().min(0, "Base salary must be positive"),
  hiringDate: z.string().min(1, "Hiring date is required"),
  headcount: z.coerce.number().min(1, "Headcount must be at least 1"),
  equityPercentage: z.union([
    z.coerce.number().min(0, "Equity cannot be negative").max(100, "Equity cannot exceed 100%"),
    z.literal(""),
  ]).optional(),
  employmentType: z.enum(["full-time", "contractor", "part-time"]),
})

type AddRoleFormValues = z.infer<typeof addRoleFormSchema>

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full-time", label: "Full-time" },
  { value: "contractor", label: "Contractor" },
  { value: "part-time", label: "Part-time" },
] as const

type AddRoleFormProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultLocationId?: string
}

export function AddRoleForm({
  open,
  onOpenChange,
  defaultLocationId,
}: AddRoleFormProps) {
  const { state, addRole } = useCalculator()
  const locations = state.locations
  const defaultLocation = defaultLocationId
    ? locations.find((loc) => loc.id === defaultLocationId)
    : locations[0]

  const form = useForm<AddRoleFormValues>({
    resolver: zodResolver(addRoleFormSchema),
    defaultValues: {
      category: "engineering",
      title: "",
      locationId: defaultLocationId ?? locations[0]?.id ?? "",
      baseSalary: 120000,
      hiringDate: new Date().toISOString().split("T")[0],
      headcount: 1,
      equityPercentage: undefined,
      employmentType: "full-time",
    },
  })

  const selectedCategory = form.watch("category")
  const selectedTitle = form.watch("title")
  const selectedLocationId = form.watch("locationId")
  const selectedLocation = locations.find((loc) => loc.id === selectedLocationId)

  // Auto-fill salary from templates if available (using selected location)
  React.useEffect(() => {
    if (selectedTitle && selectedCategory && selectedLocation) {
      const template = ROLE_TEMPLATES.find(
        (t) =>
          t.title.toLowerCase() === selectedTitle.toLowerCase() &&
          t.category === selectedCategory
      )
      if (template) {
        const salary = getSalaryForRoleAndLocation(template, selectedLocation.id)
        form.setValue("baseSalary", salary)
      }
    }
  }, [selectedTitle, selectedCategory, selectedLocation, form])

  const handleSubmit = (values: AddRoleFormValues) => {
    // Use selected location and its benefits multiplier
    const selectedLocation = locations.find((loc) => loc.id === values.locationId)

    const newRole: Omit<RoleInput, "id"> = {
      title: values.title,
      category: values.category,
      locationId: values.locationId,
      baseSalary: values.baseSalary,
      benefitsMultiplier: selectedLocation?.benefitsMultiplier ?? 0.3,
      hiringDate: values.hiringDate,
      headcount: values.headcount,
      monthPlacement: getMonthIdFromDate(new Date(values.hiringDate)),
      equityPercentage:
        values.equityPercentage === "" || values.equityPercentage === undefined
          ? undefined
          : values.equityPercentage,
      employmentType: values.employmentType,
    }

    addRole(newRole)
    form.reset({
      category: "engineering",
      title: "",
      locationId: defaultLocationId ?? locations[0]?.id ?? "",
      baseSalary: 120000,
      hiringDate: new Date().toISOString().split("T")[0],
      headcount: 1,
      equityPercentage: undefined,
      employmentType: "full-time",
    })
    onOpenChange(false)
  }

  const handleClose = () => {
    form.reset({
      category: "engineering",
      title: "",
      locationId: defaultLocationId ?? locations[0]?.id ?? "",
      baseSalary: 120000,
      hiringDate: new Date().toISOString().split("T")[0],
      headcount: 1,
      equityPercentage: undefined,
      employmentType: "full-time",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add role to hiring plan</DialogTitle>
          <DialogDescription>
            Add a new role to your hiring plan. Select a category or create a custom role.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role category</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ROLE_CATEGORY_LABELS)
                          .filter(([key]) => key !== "custom")
                          .map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the category that best fits this role
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Senior Software Engineer"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the job title for this role
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the location where you want to hire this role
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedTitle && selectedLocation && (
              <div className="p-4 bg-muted rounded-lg border border-border">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">
                      Salary Range for {selectedLocation.label}
                    </h4>
                  </div>
                  <SalaryRangeHint
                    title={selectedTitle}
                    locationId={selectedLocation.id}
                    locationMultiplier={selectedLocation.salaryMultiplier}
                    category={selectedCategory}
                  />
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="headcount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headcount</FormLabel>
                    <FormControl>
                      <FormattedNumberInput
                        value={field.value}
                        onChange={(value) => field.onChange(value ?? 1)}
                        min={1}
                      />
                    </FormControl>
                    <FormDescription>Number of people for this role</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="hiringDate"
                render={({ field }) => {
                  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)
                  const calendarRef = React.useRef<HTMLDivElement>(null)
                  const dateValue = field.value ? new Date(field.value) : undefined

                  // Close calendar when clicking outside
                  React.useEffect(() => {
                    const handleClickOutside = (event: MouseEvent) => {
                      if (
                        calendarRef.current &&
                        !calendarRef.current.contains(event.target as Node)
                      ) {
                        setIsCalendarOpen(false)
                      }
                    }

                    if (isCalendarOpen) {
                      document.addEventListener("mousedown", handleClickOutside)
                    }

                    return () => {
                      document.removeEventListener("mousedown", handleClickOutside)
                    }
                  }, [isCalendarOpen])

                  return (
                    <FormItem>
                      <FormLabel>Hiring date</FormLabel>
                      <FormControl>
                        <div className="relative" ref={calendarRef}>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !dateValue && "text-muted-foreground"
                            )}
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateValue ? (
                              format(dateValue, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                          {isCalendarOpen && (
                            <div className="absolute z-50 mt-1 bg-popover border border-border rounded-md shadow-md">
                              <Calendar
                                mode="single"
                                selected={dateValue}
                                onSelect={(date) => {
                                  if (date) {
                                    field.onChange(date.toISOString().split("T")[0])
                                    setIsCalendarOpen(false)
                                  }
                                }}
                                initialFocus
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="equityPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equity percentage (optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FormattedNumberInput
                        value={
                          field.value === "" || field.value === undefined
                            ? undefined
                            : field.value
                        }
                        onChange={(value) => field.onChange(value ?? "")}
                        min={0}
                        max={100}
                        allowDecimals
                        className="pr-12"
                      />
                      <span className="text-muted-foreground absolute inset-y-0 right-3 flex items-center text-sm">
                        %
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Equity stake as percentage of company
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button type="submit">
                <Plus className="mr-2 h-4 w-4" />
                Add role
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

