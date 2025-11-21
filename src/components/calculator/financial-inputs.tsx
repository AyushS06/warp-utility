"use client"

import * as React from "react"
import type { UseFormReturn } from "react-hook-form"

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { FormattedNumberInput } from "@/components/ui/formatted-number-input"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { CalculatorFormValues } from "@/lib/schemas/calculator"
import { useCalculator } from "@/contexts/calculator-context"
import { getCurrencySymbol } from "@/lib/currency"

type FinancialInputsProps = {
  form: UseFormReturn<CalculatorFormValues>
}

type NumericFieldConfig = {
  name: keyof CalculatorFormValues["financialInputs"]
  label: string
  description: string
  suffix?: string
  allowDecimals?: boolean
}

type DateFieldConfig = {
  name: keyof CalculatorFormValues["financialInputs"]
  label: string
  description: string
}

const foundationalFields: NumericFieldConfig[] = [
  {
    name: "totalCashOnHand",
    label: "Total cash on hand",
    description: "Cash currently available to deploy.",
    suffix: "USD",
  },
  {
    name: "companyValuation",
    label: "Company valuation",
    description: "Estimated current value of the company.",
    suffix: "USD",
  },
  {
    name: "monthlyExistingBurn",
    label: "Monthly existing burn",
    description: "Burn before new hires (rent, infra, etc.).",
    suffix: "/mo",
  },
  {
    name: "expectedMonthlyRevenue",
    label: "Expected revenue",
    description: "Recurring revenue expected each month.",
    suffix: "/mo",
  },
  {
    name: "targetRunwayMonths",
    label: "Target runway (months)",
    description: "Goal runway after hiring.",
  },
  {
    name: "contingencyBufferPercent",
    label: "Contingency buffer %",
    description: "Buffer applied to account for uncertainty.",
    suffix: "%",
    allowDecimals: true,
  },
]

const coreBurnFields: NumericFieldConfig[] = [
  {
    name: "startingCashBalance",
    label: "Starting cash balance",
    description: "Cash at the beginning of the analysis period.",
    suffix: "USD",
  },
  {
    name: "endingCashBalance",
    label: "Ending cash balance",
    description: "Cash expected at the end of the analysis period.",
    suffix: "USD",
  },
]

const periodDateFields: DateFieldConfig[] = [
  {
    name: "periodStartDate",
    label: "Period start date",
    description: "Beginning of the historical period for simple burn calculations.",
  },
  {
    name: "periodEndDate",
    label: "Period end date",
    description: "End of the historical period for simple burn calculations.",
  },
]

const incomeFields: NumericFieldConfig[] = [
  {
    name: "monthlyCashSales",
    label: "Monthly cash sales",
    description: "Recurring cash inflows from product sales or services.",
    suffix: "/mo",
  },
  {
    name: "otherMonthlyCashIncome",
    label: "Other monthly cash income",
    description: "Grants, interest, or other inflows outside of sales.",
    suffix: "/mo",
  },
]

const expenseFields: NumericFieldConfig[] = [
  {
    name: "rentAndUtilities",
    label: "Rent & utilities",
    description: "Office rent, electricity, water, and internet costs.",
    suffix: "/mo",
  },
  {
    name: "officeSuppliesAndEquipment",
    label: "Office supplies & equipment",
    description: "Consumables, maintenance, and small equipment purchases.",
    suffix: "/mo",
  },
  {
    name: "marketingExpenses",
    label: "Marketing expenses",
    description: "Advertising, campaigns, and promotional spend.",
    suffix: "/mo",
  },
  {
    name: "travelExpenses",
    label: "Travel",
    description: "Flights, lodging, and per diem for business travel.",
    suffix: "/mo",
  },
  {
    name: "otherCashExpenses",
    label: "Other cash expenses",
    description: "Software, legal, and any remaining operating spend.",
    suffix: "/mo",
  },
]

export function FinancialInputsSection({ form }: FinancialInputsProps) {
  const { state } = useCalculator()
  const currencySymbol = getCurrencySymbol(state.currency)
  
  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        {foundationalFields.map((fieldConfig) => (
          <NumberFormField
            key={fieldConfig.name}
            form={form}
            config={{
              ...fieldConfig,
              suffix: fieldConfig.suffix === "USD" ? currencySymbol : fieldConfig.suffix,
            }}
          />
        ))}
      </div>

      <Section
        title="Core burn period"
        description="Capture simple burn-rate assumptions for historical comparisons."
      >
        <div className="grid gap-6 md:grid-cols-2">
          {coreBurnFields.map((fieldConfig) => (
            <NumberFormField
              key={fieldConfig.name}
              form={form}
              config={{
                ...fieldConfig,
                suffix: fieldConfig.suffix === "USD" ? currencySymbol : fieldConfig.suffix,
              }}
            />
          ))}
          {periodDateFields.map((fieldConfig) => (
            <DateFormField
              key={fieldConfig.name}
              form={form}
              config={fieldConfig}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Monthly income"
        description="Forecast cash inflows that offset burn."
      >
        <div className="grid gap-6 md:grid-cols-2">
          {incomeFields.map((fieldConfig) => (
            <NumberFormField
              key={fieldConfig.name}
              form={form}
              config={fieldConfig}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Monthly expenses"
        description="Break down non-personnel operating costs."
      >
        <div className="grid gap-6 md:grid-cols-2">
          {expenseFields.map((fieldConfig) => {
            if (fieldConfig.name === "otherCashExpenses") {
              return (
                <div
                  key={fieldConfig.name}
                  className="flex flex-col gap-4 md:col-span-2 md:flex-row md:items-end"
                >
                  <div className="flex-1">
                    <NumberFormField form={form} config={fieldConfig} />
                  </div>
                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full md:w-auto"
                  >
                    Save financials
                  </Button>
                </div>
              )
            }

            return (
            <NumberFormField
              key={fieldConfig.name}
              form={form}
              config={fieldConfig}
            />
            )
          })}
        </div>
      </Section>
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-base font-semibold text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}

function NumberFormField({
  form,
  config,
}: {
  form: UseFormReturn<CalculatorFormValues>
  config: NumericFieldConfig
}) {
  return (
    <FormField
      control={form.control}
      name={`financialInputs.${config.name}`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{config.label}</FormLabel>
          <FormControl>
            <div className="relative">
              <FormattedNumberInput
                value={field.value}
                onChange={(value) => field.onChange(value)}
                min={0}
                allowDecimals={config.allowDecimals}
                className={config.suffix ? "pr-12" : undefined}
              />
              {config.suffix && (
                <span className="text-muted-foreground absolute inset-y-0 right-3 flex items-center text-sm">
                  {config.suffix}
                </span>
              )}
            </div>
          </FormControl>
          <FormDescription>{config.description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function DatePickerInput({
  value,
  onChange,
  label,
  description,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  description: string
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

function DateFormField({
  form,
  config,
}: {
  form: UseFormReturn<CalculatorFormValues>
  config: DateFieldConfig
}) {
  return (
    <FormField
      control={form.control}
      name={`financialInputs.${config.name}`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{config.label}</FormLabel>
          <FormControl>
            <DatePickerInput
              value={field.value}
              onChange={field.onChange}
              label={config.label}
              description={config.description}
            />
          </FormControl>
          <FormDescription>{config.description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

