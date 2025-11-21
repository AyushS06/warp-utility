"use client"

import * as React from "react"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { useFieldArray, type UseFormReturn } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { FormattedNumberInput } from "@/components/ui/formatted-number-input"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CalculatorFormValues } from "@/lib/schemas/calculator"

const employmentOptions = [
  { label: "Full-time", value: "full-time" },
  { label: "Contractor", value: "contractor" },
  { label: "Part-time", value: "part-time" },
]

function DatePickerInput({
  value,
  onChange,
  compact = false,
}: {
  value: string
  onChange: (value: string) => void
  compact?: boolean
}) {
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)
  const calendarRef = React.useRef<HTMLDivElement>(null)
  const dateValue = value ? new Date(value) : undefined

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
    <div className="relative" ref={calendarRef}>
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal",
          compact && "h-9",
          !dateValue && "text-muted-foreground"
        )}
        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
      >
        <CalendarIcon className={cn("mr-2", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
        {dateValue ? (
          <span className={compact ? "text-xs" : ""}>
            {format(dateValue, compact ? "MMM d, yyyy" : "PPP")}
          </span>
        ) : (
          <span className={compact ? "text-xs" : ""}>Pick date</span>
        )}
      </Button>
      {isCalendarOpen && (
        <div className="absolute z-50 mt-1 bg-popover border border-border rounded-md shadow-md">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={(date) => {
              if (date) {
                onChange(date.toISOString().split("T")[0])
                setIsCalendarOpen(false)
              }
            }}
            initialFocus
          />
        </div>
      )}
    </div>
  )
}

type HiringPlanTableProps = {
  form: UseFormReturn<CalculatorFormValues>
}

export function HiringPlanTable({ form }: HiringPlanTableProps) {
  const { control, watch, setValue } = form
  const locations = watch("locations")

  const { fields, append, remove } = useFieldArray({
    control,
    name: "roles",
  })

  const handleAddRole = React.useCallback(() => {
    const defaultLocation = locations[0]

    append({
      title: "",
      locationId: defaultLocation?.id ?? "",
      baseSalary: 120000,
      benefitsMultiplier:
        defaultLocation?.benefitsMultiplier ?? 0.3,
      hiringDate: new Date().toISOString().split("T")[0],
      headcount: 1,
      equityPercentage: undefined,
      employmentType: "full-time",
    })
  }, [append, locations])

  // Note: Role picker is handled by parent HiringPlanSection component

  return (
    <div className="space-y-4 w-full">
      <div className="overflow-x-auto w-full">
        <Table className="min-w-[1200px] w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Role title</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Base salary</TableHead>
            <TableHead>Benefits / tax</TableHead>
            <TableHead>Hiring date</TableHead>
            <TableHead>Headcount</TableHead>
            <TableHead>Equity %</TableHead>
            <TableHead>Type</TableHead>
            <TableHead />
          </TableRow>
          </TableHeader>
          <TableBody>
            {fields.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={9}
                className="text-center text-muted-foreground py-6"
              >
                No roles added yet. Click “Add role” to start planning.
              </TableCell>
            </TableRow>
          ) : (
            fields.map((field, index) => (
              <TableRow key={field.id}>
                <TableCell className="min-w-40 align-top">
                  <FormField
                    control={control}
                    name={`roles.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Role title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Senior Engineer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell className="min-w-36 align-top">
                  <FormField
                    control={control}
                    name={`roles.${index}.locationId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Location</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value)
                            const selected = locations.find(
                              (location) => location.id === value
                            )
                            if (selected) {
                              setValue(
                                `roles.${index}.benefitsMultiplier`,
                                selected.benefitsMultiplier
                              )
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell className="min-w-32 align-top">
                  <FormField
                    control={control}
                    name={`roles.${index}.baseSalary`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Base salary</FormLabel>
                        <FormControl>
                          <FormattedNumberInput
                            value={field.value}
                            onChange={(value) => field.onChange(value)}
                            min={0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell className="min-w-32 align-top">
                  <FormField
                    control={control}
                    name={`roles.${index}.benefitsMultiplier`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Benefits multiplier</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell className="min-w-32 align-top">
                  <FormField
                    control={control}
                    name={`roles.${index}.hiringDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Hiring date</FormLabel>
                        <FormControl>
                          <DatePickerInput
                            value={field.value}
                            onChange={field.onChange}
                            compact
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell className="min-w-28 align-top">
                  <FormField
                    control={control}
                    name={`roles.${index}.headcount`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Headcount</FormLabel>
                        <FormControl>
                          <FormattedNumberInput
                            value={field.value}
                            onChange={(value) => field.onChange(value)}
                            min={1}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell className="min-w-28 align-top">
                  <FormField
                    control={control}
                    name={`roles.${index}.equityPercentage`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Equity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step="0.1"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell className="min-w-32 align-top">
                  <FormField
                    control={control}
                    name={`roles.${index}.employmentType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Role type</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employmentOptions.map((option) => (
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
                </TableCell>
                <TableCell className="align-top">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    aria-label="Remove role"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
          </TableBody>
        </Table>
      </div>

      <Button type="button" variant="outline" onClick={handleAddRole}>
        <PlusIcon className="mr-2 h-4 w-4" />
        Add role
      </Button>
    </div>
  )
}

